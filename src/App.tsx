import React, { useState, useRef, useEffect } from 'react';
import { Upload, Mic, Play, Pause, Download } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import AudioProcessor from './components/AudioProcessor';
import StatusIndicator from './components/StatusIndicator';
import { ProcessingStatus } from './types';

function App() {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (waveformRef.current && processedAudioUrl) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#3b82f6',
        progressColor: '#1d4ed8',
        cursorWidth: 2,
        cursorColor: '#1d4ed8',
        height: 96,
        normalize: true,
      });

      wavesurferRef.current.load(processedAudioUrl);
      
      wavesurferRef.current.on('finish', () => setIsPlaying(false));
      
      return () => {
        wavesurferRef.current?.destroy();
      };
    }
  }, [processedAudioUrl]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    
    if (!file) return;
    
    if (file.type !== 'audio/wav') {
      setError('Please upload a WAV file');
      return;
    }
    
    setStatus('processing');
  };

  const handleRecordClick = () => {
    setError(null);
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      setStatus('processing');
    }
  };

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (processedAudioUrl) {
      const link = document.createElement('a');
      link.href = processedAudioUrl;
      link.download = 'processed-audio.wav';
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Acoustic Echo Cancellation</h1>
          <p className="text-lg text-gray-600">Process your audio in real-time with deep learning</p>
        </header>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/wav"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div 
                className={`bg-blue-50 rounded-xl p-6 hover:bg-blue-100 transition-colors cursor-pointer ${
                  error ? 'border-2 border-red-500' : ''
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex items-center space-x-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Upload Audio</h3>
                    <p className="text-sm text-gray-600">Support for WAV files</p>
                    {error && (
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    )}
                  </div>
                </div>
              </div>

              <div 
                className={`${
                  isRecording ? 'bg-red-50' : 'bg-blue-50'
                } rounded-xl p-6 hover:bg-opacity-80 transition-colors cursor-pointer`}
                onClick={handleRecordClick}
              >
                <div className="flex items-center space-x-4">
                  <Mic className={`w-8 h-8 ${isRecording ? 'text-red-600' : 'text-blue-600'}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Record Audio</h3>
                    <p className="text-sm text-gray-600">
                      {isRecording ? 'Recording in progress...' : 'Click to start recording'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processed Audio</h3>
              {processedAudioUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <button 
                      className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors"
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button 
                      className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors"
                      onClick={handleDownload}
                    >
                      <Download className="w-6 h-6" />
                    </button>
                  </div>
                  <div ref={waveformRef} className="h-24 bg-white rounded-lg border-2 border-blue-200" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  No processed audio yet
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <StatusIndicator status={status} />
            </div>
          </div>
        </div>
      </div>

      <AudioProcessor
        onProcessingComplete={setProcessedAudioUrl}
        onStatusChange={setStatus}
      />
    </div>
  );
}

export default App;