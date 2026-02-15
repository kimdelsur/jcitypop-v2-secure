
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { PlaybackState, Prompt } from '../types';
import { GoogleGenAI, type AudioChunk, type LiveMusicFilteredPrompt, type LiveMusicServerMessage, type LiveMusicSession } from '@google/genai';
import { decode, decodeAudioData } from './audio';
import { throttle } from './throttle';

export class LiveMusicHelper extends EventTarget {

  private ai: GoogleGenAI;
  private model: string;

  private session: LiveMusicSession | null = null;
  private sessionPromise: Promise<LiveMusicSession> | null = null;

  private connectionError = true;

  private filteredPrompts = new Set<string>();
  private nextStartTime = 0;
  private bufferTime = 2;

  public readonly audioContext: AudioContext;
  public extraDestination: AudioNode | null = null;

  private outputNode: GainNode;
  private playbackState: PlaybackState = 'stopped';

  private prompts: Map<string, Prompt>;
  private chordProgression: string = "";
  private percussionStyle: string = "Iconic 1980s electronic drum machine beat, crisp and processed";
  private bpm: number = 115;
  
  // Recording properties
  private mediaRecorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];
  private audioDestination: MediaStreamAudioDestinationNode;

  constructor(ai: GoogleGenAI, model: string) {
    super();
    this.ai = ai;
    this.model = model;
    this.prompts = new Map();
    this.audioContext = new AudioContext({ sampleRate: 48000 });
    
    // Setup persistent audio chain: 
    // All audio chunks -> outputNode (Master) -> [Hardware Speakers, Recording Destination]
    this.outputNode = this.audioContext.createGain();
    this.audioDestination = this.audioContext.createMediaStreamDestination();
    
    this.outputNode.connect(this.audioContext.destination);
    this.outputNode.connect(this.audioDestination);
    
    // Initialize muted
    this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
  }

  private getSession(): Promise<LiveMusicSession> {
    if (!this.sessionPromise) this.sessionPromise = this.connect();
    return this.sessionPromise;
  }

  private async connect(): Promise<LiveMusicSession> {
    this.sessionPromise = this.ai.live.music.connect({
      model: this.model,
      callbacks: {
        onmessage: async (e: LiveMusicServerMessage) => {
          if (e.setupComplete) {
            this.connectionError = false;
          }
          if (e.filteredPrompt) {
            this.filteredPrompts = new Set([...this.filteredPrompts, e.filteredPrompt.text!])
            this.dispatchEvent(new CustomEvent<LiveMusicFilteredPrompt>('filtered-prompt', { detail: e.filteredPrompt }));
          }
          if (e.serverContent?.audioChunks) {
            await this.processAudioChunks(e.serverContent.audioChunks);
          }
        },
        onerror: () => {
          this.connectionError = true;
          this.stop();
          this.dispatchEvent(new CustomEvent('error', { detail: 'Connection error, please restart audio.' }));
        },
        onclose: () => {
          this.connectionError = true;
          this.stop();
          this.dispatchEvent(new CustomEvent('error', { detail: 'Connection error, please restart audio.' }));
        },
      },
    });
    return this.sessionPromise;
  }

  private setPlaybackState(state: PlaybackState) {
    this.playbackState = state;
    this.dispatchEvent(new CustomEvent('playback-state-changed', { detail: state }));
  }

  private async processAudioChunks(audioChunks: AudioChunk[]) {
    if (this.playbackState === 'paused' || this.playbackState === 'stopped') return;
    const audioBuffer = await decodeAudioData(
      decode(audioChunks[0].data!),
      this.audioContext,
      48000,
      2,
    );
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Connect to the master gain node
    source.connect(this.outputNode);
    
    if (this.nextStartTime === 0) {
      this.nextStartTime = this.audioContext.currentTime + this.bufferTime;
      setTimeout(() => {
        this.setPlaybackState('playing');
      }, this.bufferTime * 1000);
    }
    if (this.nextStartTime < this.audioContext.currentTime) {
      this.setPlaybackState('loading');
      this.nextStartTime = 0;
      return;
    }
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  public get activePrompts() {
    return Array.from(this.prompts.values())
      .filter((p) => {
        return !this.filteredPrompts.has(p.text) && p.weight !== 0;
      })
  }

  public setChordProgression(progression: string) {
    this.chordProgression = progression;
    this.setWeightedPrompts(this.prompts);
  }

  public setPercussionStyle(style: string) {
    this.percussionStyle = style;
    this.setWeightedPrompts(this.prompts);
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
    this.setWeightedPrompts(this.prompts);
  }

  public readonly setWeightedPrompts = throttle(async (prompts: Map<string, Prompt>) => {
    this.prompts = prompts;

    if (this.activePrompts.length === 0) {
      this.dispatchEvent(new CustomEvent('error', { detail: 'There needs to be one active prompt to play.' }));
      this.pause();
      return;
    }

    if (!this.session) return;

    const weightedPrompts = this.activePrompts.map((p) => {
      return {text: p.text, weight: p.weight};
    });

    if (this.chordProgression) {
      weightedPrompts.push({ text: `Style: ${this.chordProgression}`, weight: 1.0 });
    }

    if (this.percussionStyle) {
      weightedPrompts.push({ text: `Drums: ${this.percussionStyle}`, weight: 1.2 });
    }

    weightedPrompts.push({ text: `Tempo: ${this.bpm} BPM`, weight: 2.0 });

    try {
      await this.session.setWeightedPrompts({
        weightedPrompts,
      });
    } catch (e: any) {
      this.dispatchEvent(new CustomEvent('error', { detail: e.message }));
      this.pause();
    }
  }, 200);

  public async play() {
    this.setPlaybackState('loading');
    this.session = await this.getSession();
    await this.setWeightedPrompts(this.prompts);
    this.audioContext.resume();
    this.session.play();
    
    if (this.extraDestination) this.outputNode.connect(this.extraDestination);
    
    // Ramp up volume
    this.outputNode.gain.setTargetAtTime(1, this.audioContext.currentTime, 0.05);
  }

  public pause() {
    if (this.session) this.session.pause();
    this.setPlaybackState('paused');
    // Ramp down volume
    this.outputNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.05);
    this.nextStartTime = 0;
  }

  public stop() {
    if (this.session) this.session.stop();
    this.setPlaybackState('stopped');
    this.outputNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.05);
    this.nextStartTime = 0;
    this.session = null;
    this.sessionPromise = null;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.stopRecording();
    }
  }

  public async playPause() {
    switch (this.playbackState) {
      case 'playing':
        return this.pause();
      case 'paused':
      case 'stopped':
        return this.play();
      case 'loading':
        return this.stop();
    }
  }

  public async startRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') return;
    
    // Ensure the audio context is active
    await this.audioContext.resume();
    
    this.recordingChunks = [];
    
    // Determine supported MIME type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
      ? 'audio/webm;codecs=opus' 
      : 'audio/ogg;codecs=opus';

    try {
      this.mediaRecorder = new MediaRecorder(this.audioDestination.stream, { mimeType });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.recordingChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        if (this.recordingChunks.length === 0) return;
        
        const blob = new Blob(this.recordingChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const extension = mimeType.includes('webm') ? 'webm' : 'ogg';
        const activeText = this.activePrompts.map(p => p.text).join('_').substring(0, 30);
        a.download = `PromptDJ_Stem_${activeText || 'session'}_${Date.now()}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      this.mediaRecorder.start();
      this.dispatchEvent(new CustomEvent('recording-state-changed', { detail: 'recording' }));
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      this.dispatchEvent(new CustomEvent('error', { detail: 'Recording failed: ' + err.message }));
    }
  }

  public stopRecording() {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;
    this.mediaRecorder.stop();
    this.dispatchEvent(new CustomEvent('recording-state-changed', { detail: 'idle' }));
  }
}
