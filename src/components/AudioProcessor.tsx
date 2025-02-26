import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { AudioProcessorProps, ModelConfig, ProcessingOptions } from '../types';
import { normalizeAudio, trimSilence, splitIntoFrames, reconstructFromFrames } from '../utils/audioUtils';

const MODEL_CONFIG: ModelConfig = {
  frameLength: 512,
  samplingRate: 16000,
  hopLength: 128
};

const AudioProcessor: React.FC<AudioProcessorProps> = ({
  onProcessingComplete,
  onStatusChange,
}) => {
  const modelRef = useRef<tf.LayersModel | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      try {
        onStatusChange('processing');
        // First check if model files exist
        const modelResponse = await fetch('public/tfjs_model/model.json');
        if (!modelResponse.ok) {
          throw new Error('Model files not found. Please ensure the model is properly converted and placed in the public directory.');
        }

        // Load the model
        modelRef.current = await tf.loadLayersModel('public/tfjs_model/model.json');
        setModelLoaded(true);
        onStatusChange('idle');
      } catch (error) {
        console.error('Error loading model:', error);
        onStatusChange('error');
      }
    };

    loadModel();
  }, [onStatusChange]);

  const processAudioData = async (
    audioData: Float32Array,
    options: ProcessingOptions = {}
  ): Promise<Float32Array> => {
    if (!modelRef.current) {
      throw new Error('Model not loaded');
    }

    let processedData = audioData;

    // Optional preprocessing
    if (options.normalize) {
      processedData = normalizeAudio(processedData);
    }
    if (options.trimSilence) {
      processedData = trimSilence(processedData);
    }

    // Split into frames
    const frames = splitIntoFrames(
      processedData,
      MODEL_CONFIG.frameLength,
      MODEL_CONFIG.hopLength
    );

    // Process each frame
    const processedFrames = await Promise.all(
      frames.map(async (frame) => {
        const inputTensor = tf.tensor2d([Array.from(frame)]);
        const outputTensor = modelRef.current!.predict(inputTensor) as tf.Tensor;
        const outputData = await outputTensor.data();
        inputTensor.dispose();
        outputTensor.dispose();
        return new Float32Array(outputData);
      })
    );

    // Reconstruct the signal
    return reconstructFromFrames(
      processedFrames,
      MODEL_CONFIG.hopLength,
      audioData.length
    );
  };

  const processAudioFile = async (file: File) => {
    try {
      if (!modelLoaded) {
        throw new Error('Model not loaded yet');
      }

      onStatusChange('processing');
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get audio data from the first channel
      const inputData = audioBuffer.getChannelData(0);
      
      // Process the audio data
      const processedData = await processAudioData(inputData, {
        normalize: true,
        trimSilence: true
      });
      
      // Create a new buffer with the processed data
      const processedBuffer = audioContext.createBuffer(
        1,
        processedData.length,
        audioContext.sampleRate
      );
      processedBuffer.getChannelData(0).set(processedData);
      
      // Convert to WAV and create URL
      const processedBlob = await bufferToWav(processedBuffer);
      const processedUrl = URL.createObjectURL(processedBlob);
      
      onProcessingComplete(processedUrl);
      onStatusChange('done');
    } catch (error) {
      console.error('Error processing audio:', error);
      onStatusChange('error');
    }
  };

  const startRecording = async () => {
    try {
      if (!modelLoaded) {
        throw new Error('Model not loaded yet');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudioFile(audioBlob as File);
      };

      mediaRecorder.start();
      onStatusChange('processing');
    } catch (error) {
      console.error('Error starting recording:', error);
      onStatusChange('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const bufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const view = new DataView(new ArrayBuffer(44 + length));

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * buffer.numberOfChannels, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      view.setInt16(offset, channelData[i] * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return null;
};

export default AudioProcessor;
