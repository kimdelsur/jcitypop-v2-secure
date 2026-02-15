
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { throttle } from '../utils/throttle';

import './PromptController';
import './PlayPauseButton';
import type { PlaybackState, RecordingState, Prompt, ChordProgression, PercussionStyle } from '../types';
import { MidiDispatcher } from '../utils/MidiDispatcher';

const PROGRESSIONS: ChordProgression[] = [
  { id: 'standard', name: 'Smooth Loop', description: 'Classic City Pop ambiance' },
  { id: 'royal', name: 'Royal Road (IVM7-V7-iii7-vi)', description: 'The hallmark sophisticated J-Pop sound' },
  { id: 'urban', name: 'Urban Drive (ii7-V7-Imaj7)', description: 'Jazz-influenced sophisticated harmony' },
  { id: 'summer', name: 'Summer Vibes (IVmaj7-iii7-vi7)', description: 'Bright, nostalgic and energetic' },
  { id: 'chromatic', name: 'Nostalgic Descent', description: 'Smooth chromatic bassline movements' },
  { id: 'jazz', name: 'Late Night Jazz (9th/13th)', description: 'Deep extensions and jazz voicings' },
];

const PERCUSSION_STYLES: PercussionStyle[] = [
  { id: 'linn', name: 'LinnDrum 80s', description: 'Iconic 1980s electronic drum machine beat, crisp and processed' },
  { id: 'disco', name: 'Tight City Disco', description: 'Driving 4/4 disco beat with crisp hi-hats and a steady kick' },
  { id: 'fusion', name: 'Fusion Jazz Break', description: 'Sophisticated syncopated jazz-fusion drumming with complex fills' },
  { id: 'bossa', name: 'Beachside Bossa', description: 'Soft resort-style percussion with subtle shakers and side-stick' },
  { id: 'funk', name: 'Midnight Urban Funk', description: 'Heavy urban groove with syncopated kick and deep ghost notes' },
  { id: 'lounge', name: 'Rimshot Lounge', description: 'Minimalist sophisticated rhythm with heavy use of rimshots and jazz cymbals' },
];

/** The grid of prompt inputs. */
@customElement('prompt-dj-midi')
export class PromptDjMidi extends LitElement {
  // Removed override
  static styles = css`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      position: relative;
      background-color: #080808;
      overflow: hidden;
    }
    #background {
      will-change: background-image;
      position: absolute;
      height: 100%;
      width: 100%;
      z-index: -1;
      background: #111;
    }
    #grid {
      width: 90vmin;
      height: 70vmin;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(5, 1fr);
      gap: 2vmin;
      margin-top: 18vmin; /* Increased margin to clear the larger top bar */
    }
    prompt-controller {
      width: 100%;
    }
    
    /* Session Control Layout */
    #top-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 20vmin;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px;
      box-sizing: border-box;
      z-index: 20;
    }

    #top-left {
      display: flex;
      gap: 12px;
      align-items: center;
      flex: 1;
    }

    #top-center {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    #top-right {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
      flex: 1;
      max-width: 250px;
    }

    play-pause-button {
      width: 14vmin;
      cursor: pointer;
      pointer-events: auto;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      align-items: flex-end;
    }

    .label {
      color: #01cdfe;
      font-size: 1vmin;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-shadow: 0 0 5px rgba(1, 205, 254, 0.5);
    }
    .label-pink {
      color: #ff71ce;
      text-shadow: 0 0 5px rgba(255, 113, 206, 0.5);
    }
    .label-green {
      color: #05ffa1;
      text-shadow: 0 0 5px rgba(5, 255, 161, 0.5);
    }

    button {
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      color: #fff;
      background: #0004;
      -webkit-font-smoothing: antialiased;
      border: 1.5px solid #fff;
      border-radius: 4px;
      user-select: none;
      padding: 6px 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.2s ease;
      font-size: 1.4vmin;
    }
    button:hover {
      background: #fff;
      color: #000;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
    }
    button.active {
      background-color: #fff;
      color: #000;
    }
    button.rec-btn {
      border-color: #ff0055;
      color: #ff0055;
    }
    button.rec-btn.recording {
      background: #ff0055;
      color: #fff;
      animation: pulse 1.5s infinite;
      box-shadow: 0 0 20px rgba(255, 0, 85, 0.8);
      border-color: #fff;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.6; }
      100% { opacity: 1; }
    }

    select {
      font: inherit;
      padding: 4px 8px;
      background: #0009;
      color: #fff;
      border-radius: 4px;
      border: 1.5px solid #05ffa1;
      outline: none;
      cursor: pointer;
      font-size: 1.4vmin;
      font-weight: 600;
      transition: border-color 0.2s ease;
      width: 100%;
    }
    select:focus {
      border-color: #fff;
      box-shadow: 0 0 8px rgba(5, 255, 161, 0.3);
    }
    select.midi-select {
      border-color: #fff;
      font-size: 1.4vmin;
      width: auto;
    }

    .bpm-container {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }
    .bpm-display {
      color: #fff;
      font-family: monospace;
      font-size: 1.8vmin;
      font-weight: bold;
      min-width: 3.5ch;
      text-align: right;
    }
    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
      background: transparent;
    }
    input[type=range]:focus {
      outline: none;
    }
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      cursor: pointer;
      background: #222;
      border-radius: 2px;
      border: 1px solid #ff71ce33;
    }
    input[type=range]::-webkit-slider-thumb {
      height: 14px;
      width: 14px;
      border-radius: 50%;
      background: #ff71ce;
      cursor: pointer;
      -webkit-appearance: none;
      margin-top: -5px;
      box-shadow: 0 0 8px #ff71ce;
      border: 1.5px solid #fff;
    }
  `;

  private prompts: Map<string, Prompt>;
  private midiDispatcher: MidiDispatcher;

  @property({ type: Boolean }) private showMidi = false;
  @property({ type: String }) public playbackState: PlaybackState = 'stopped';
  @property({ type: String }) public recordingState: RecordingState = 'idle';
  @state() public audioLevel = 0;
  @state() private midiInputIds: string[] = [];
  @state() private activeMidiInputId: string | null = null;
  @state() private currentProgressionId = 'standard';
  @state() private currentPercussionId = 'linn';
  @state() private bpm = 115;

  @property({ type: Object })
  private filteredPrompts = new Set<string>();

  constructor(
    initialPrompts: Map<string, Prompt>,
  ) {
    super();
    this.prompts = initialPrompts;
    this.midiDispatcher = new MidiDispatcher();
  }

  private handlePromptChanged(e: CustomEvent<Prompt>) {
    const { promptId, text, weight, cc } = e.detail;
    const prompt = this.prompts.get(promptId);
    if (!prompt) return;

    prompt.text = text;
    prompt.weight = weight;
    prompt.cc = cc;

    const newPrompts = new Map(this.prompts);
    newPrompts.set(promptId, prompt);
    this.prompts = newPrompts;
    (this as any).requestUpdate();
    (this as any).dispatchEvent(new CustomEvent('prompts-changed', { detail: this.prompts }));
  }

  private handleProgressionChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    this.currentProgressionId = val;
    const progression = PROGRESSIONS.find(p => p.id === val);
    (this as any).dispatchEvent(new CustomEvent('progression-changed', { detail: progression?.description }));
  }

  private handlePercussionChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    this.currentPercussionId = val;
    const style = PERCUSSION_STYLES.find(s => s.id === val);
    (this as any).dispatchEvent(new CustomEvent('percussion-changed', { detail: style?.description }));
  }

  private handleBpmChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value);
    this.bpm = val;
    (this as any).dispatchEvent(new CustomEvent('bpm-changed', { detail: val }));
  }

  private readonly makeBackground = throttle(
    () => {
      const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
      const MAX_WEIGHT = 0.5;
      const MAX_ALPHA = 0.5;
      const bg: string[] = [];

      [...this.prompts.values()].forEach((p, i) => {
        const alphaPct = clamp01(p.weight / MAX_WEIGHT) * MAX_ALPHA;
        const alpha = Math.round(alphaPct * 0xff).toString(16).padStart(2, '0');
        const stop = p.weight / 2.5;
        const x = (i % 4) / 3;
        const y = Math.floor(i / 4) / 4;
        const s = `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${p.color}${alpha} 0px, ${p.color}00 ${stop * 100}%)`;
        bg.push(s);
      });
      return bg.join(', ');
    },
    30,
  );

  private toggleShowMidi() {
    return this.setShowMidi(!this.showMidi);
  }

  public async setShowMidi(show: boolean) {
    this.showMidi = show;
    if (!this.showMidi) return;
    try {
      const inputIds = await this.midiDispatcher.getMidiAccess();
      this.midiInputIds = inputIds;
      this.activeMidiInputId = this.midiDispatcher.activeMidiInputId;
    } catch (e: any) {
      this.showMidi = false;
      (this as any).dispatchEvent(new CustomEvent('error', {detail: e.message}));
    }
  }

  private handleMidiInputChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.activeMidiInputId = selectElement.value;
    this.midiDispatcher.activeMidiInputId = selectElement.value;
  }

  private playPause() {
    (this as any).dispatchEvent(new CustomEvent('play-pause'));
  }

  private toggleRecording() {
    (this as any).dispatchEvent(new CustomEvent('toggle-recording'));
  }

  public addFilteredPrompt(prompt: string) {
    this.filteredPrompts = new Set([...this.filteredPrompts, prompt]);
  }

  render() {
    const bg = styleMap({
      backgroundImage: this.makeBackground(),
    });
    return html`
      <div id="background" style=${bg}></div>
      
      <div id="top-bar">
        <!-- Technical Controls -->
        <div id="top-left">
          <button
            @click=${this.toggleShowMidi}
            class=${this.showMidi ? 'active' : ''}
            >MIDI</button
          >
          <button
            @click=${this.toggleRecording}
            class=${`rec-btn ${this.recordingState === 'recording' ? 'recording' : ''}`}
            >${this.recordingState === 'recording' ? 'STOP' : 'REC STEM'}</button
          >
          <select
            class="midi-select"
            @change=${this.handleMidiInputChange}
            .value=${this.activeMidiInputId || ''}
            style=${this.showMidi ? '' : 'visibility: hidden'}>
            ${this.midiInputIds.length > 0
              ? this.midiInputIds.map(
                (id) => html`<option value=${id}>${this.midiDispatcher.getDeviceName(id)}</option>`,
              )
              : html`<option value="">No devices found</option>`}
          </select>
        </div>

        <!-- Master Transport -->
        <div id="top-center">
          <play-pause-button .playbackState=${this.playbackState} @click=${this.playPause}></play-pause-button>
          <span class="label" style="margin-top: -10px">${this.playbackState === 'playing' ? 'PAUSE' : 'PLAY'}</span>
        </div>

        <!-- Harmonic & Temporal Controls -->
        <div id="top-right">
          <div class="control-group">
            <span class="label">Harmony</span>
            <select @change=${this.handleProgressionChange} .value=${this.currentProgressionId}>
              ${PROGRESSIONS.map(p => html`<option value=${p.id}>${p.name}</option>`)}
            </select>
          </div>

          <div class="control-group">
            <span class="label label-green">Drums</span>
            <select @change=${this.handlePercussionChange} .value=${this.currentPercussionId}>
              ${PERCUSSION_STYLES.map(s => html`<option value=${s.id}>${s.name}</option>`)}
            </select>
          </div>

          <div class="control-group">
            <span class="label label-pink">Tempo (BPM)</span>
            <div class="bpm-container">
              <span class="bpm-display">${this.bpm}</span>
              <input type="range" min="60" max="180" step="1" .value=${this.bpm} @input=${this.handleBpmChange}>
            </div>
          </div>
        </div>
      </div>

      <div id="grid">${this.renderPrompts()}</div>
    `;
  }

  private renderPrompts() {
    return [...this.prompts.values()].map((prompt) => {
      return html`<prompt-controller
        promptId=${prompt.promptId}
        ?filtered=${this.filteredPrompts.has(prompt.text)}
        cc=${prompt.cc}
        text=${prompt.text}
        weight=${prompt.weight}
        color=${prompt.color}
        .midiDispatcher=${this.midiDispatcher}
        .showCC=${this.showMidi}
        audioLevel=${this.audioLevel}
        @prompt-changed=${this.handlePromptChanged}>
      </prompt-controller>`;
    });
  }
}
