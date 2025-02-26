export type ProcessingStatus = 'idle' | 'processing' | 'done' | 'error';

export interface AudioProcessorProps {
  onProcessingComplete: (audioUrl: string) => void;
  onStatusChange: (status: ProcessingStatus) => void;
}

export interface ModelConfig {
  frameLength: number;
  samplingRate: number;
  hopLength: number;
}

export interface ProcessingOptions {
  normalize?: boolean;
  trimSilence?: boolean;
}