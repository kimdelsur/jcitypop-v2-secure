
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export interface Prompt {
  readonly promptId: string;
  text: string;
  weight: number;
  cc: number;
  color: string;
}

export interface ControlChange {
  channel: number;
  cc: number;
  value: number;
}

export interface ChordProgression {
  id: string;
  name: string;
  description: string;
}

export interface PercussionStyle {
  id: string;
  name: string;
  description: string;
}

export type PlaybackState = 'stopped' | 'playing' | 'loading' | 'paused';
export type RecordingState = 'idle' | 'recording';
