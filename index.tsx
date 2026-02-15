
/**
 * @fileoverview Control real time music with a MIDI controller
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlaybackState, RecordingState, Prompt } from './types';
import { GoogleGenAI, LiveMusicFilteredPrompt } from '@google/genai';
import { PromptDjMidi } from './components/PromptDjMidi';
import { ToastMessage } from './components/ToastMessage';
import { LiveMusicHelper } from './utils/LiveMusicHelper';
import { AudioAnalyser } from './utils/AudioAnalyser';

// Initialize Gemini AI with API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('VITE_GEMINI_API_KEY environment variable is not set. Please check your .env.local file.');
}

const ai = new GoogleGenAI({ apiKey });
const model = 'lyria-realtime-exp';

function main() {
  const initialPrompts = buildInitialPrompts();

  // Cast instances to any to bypass type resolution issues with custom elements in this environment.
  const pdjMidi = new PromptDjMidi(initialPrompts) as any;
  document.body.appendChild(pdjMidi);

  const toastMessage = new ToastMessage() as any;
  document.body.appendChild(toastMessage);

  const liveMusicHelper = new LiveMusicHelper(ai, model);
  liveMusicHelper.setWeightedPrompts(initialPrompts);

  const audioAnalyser = new AudioAnalyser(liveMusicHelper.audioContext);
  liveMusicHelper.extraDestination = audioAnalyser.node;

  pdjMidi.addEventListener('prompts-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<Map<string, Prompt>>;
    const prompts = customEvent.detail;
    liveMusicHelper.setWeightedPrompts(prompts);
  }));

  pdjMidi.addEventListener('progression-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<string>;
    const progressionDescription = customEvent.detail;
    liveMusicHelper.setChordProgression(progressionDescription);
  }));

  pdjMidi.addEventListener('percussion-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<string>;
    const percussionDescription = customEvent.detail;
    liveMusicHelper.setPercussionStyle(percussionDescription);
  }));

  pdjMidi.addEventListener('bpm-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<number>;
    const bpm = customEvent.detail;
    liveMusicHelper.setBpm(bpm);
  }));

  pdjMidi.addEventListener('play-pause', () => {
    liveMusicHelper.playPause();
  });

  pdjMidi.addEventListener('toggle-recording', () => {
    if (pdjMidi.recordingState === 'recording') {
      liveMusicHelper.stopRecording();
    } else {
      liveMusicHelper.startRecording();
    }
  });

  liveMusicHelper.addEventListener('playback-state-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<PlaybackState>;
    const playbackState = customEvent.detail;
    pdjMidi.playbackState = playbackState;
    playbackState === 'playing' ? audioAnalyser.start() : audioAnalyser.stop();
  }));

  liveMusicHelper.addEventListener('recording-state-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<RecordingState>;
    const recordingState = customEvent.detail;
    pdjMidi.recordingState = recordingState;
  }));

  liveMusicHelper.addEventListener('filtered-prompt', ((e: Event) => {
    const customEvent = e as CustomEvent<LiveMusicFilteredPrompt>;
    const filteredPrompt = customEvent.detail;
    toastMessage.show(filteredPrompt.filteredReason!)
    pdjMidi.addFilteredPrompt(filteredPrompt.text!);
  }));

  const errorToast = ((e: Event) => {
    const customEvent = e as CustomEvent<string>;
    const error = customEvent.detail;
    toastMessage.show(error);
  });

  liveMusicHelper.addEventListener('error', errorToast);
  pdjMidi.addEventListener('error', errorToast);

  audioAnalyser.addEventListener('audio-level-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<number>;
    const level = customEvent.detail;
    pdjMidi.audioLevel = level;
  }));

}

function buildInitialPrompts() {
  // Select a balanced "Starter Pack" from the 20 elements
  const requestedPrompts = [
    'Japanese City Pop',
    '80s Slap Bass',
    'Yamaha DX7 Keys',
    'Instrumental'
  ];

  const prompts = new Map<string, Prompt>();

  for (let i = 0; i < DEFAULT_PROMPTS.length; i++) {
    const promptId = `prompt-${i}`;
    const prompt = DEFAULT_PROMPTS[i];
    const { text, color } = prompt;
    prompts.set(promptId, {
      promptId,
      text,
      weight: requestedPrompts.includes(text) ? 1 : 0,
      cc: i,
      color,
    });
  }

  return prompts;
}

const DEFAULT_PROMPTS = [
  // Row 1: The Core Genre & Rhythm
  { color: '#ff71ce', text: 'Japanese City Pop' },
  { color: '#01cdfe', text: '80s Slap Bass' },
  { color: '#05ffa1', text: 'Tight Disco Beat' },
  { color: '#b967ff', text: 'Yamaha DX7 Keys' },

  // Row 2: Melodic Instruments
  { color: '#fffb96', text: 'Smooth Sax Solo' },
  { color: '#ff71ce', text: 'Funky Stratocaster' },
  { color: '#01cdfe', text: 'Brass Fanfare' },
  { color: '#05ffa1', text: 'Electric Piano' },

  // Row 3: Textures & Atmosphere
  { color: '#b967ff', text: 'Analog Juno Pads' },
  { color: '#fffb96', text: 'Chorus Shimmer' },
  { color: '#ff71ce', text: 'Night FM Filter' },
  { color: '#01cdfe', text: 'Urban Sophistication' },

  // Row 4: Vibes & Settings
  { color: '#05ffa1', text: 'Late Night Drive' },
  { color: '#b967ff', text: 'Ocean Breeze' },
  { color: '#fffb96', text: 'Tropical Resort' },
  { color: '#ff71ce', text: 'Jazz Fusion Chords' },

  // Row 5: Technical & Production
  { color: '#01cdfe', text: 'Instrumental' },
  { color: '#05ffa1', text: 'No Vocals' },
  { color: '#b967ff', text: 'Nostalgic 1984' },
  { color: '#fffb96', text: 'Sunset Vibe' },
];

main();
