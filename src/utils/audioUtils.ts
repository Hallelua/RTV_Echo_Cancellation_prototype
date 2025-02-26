export const normalizeAudio = (audioData: Float32Array): Float32Array => {
  const maxVal = Math.max(...audioData.map(Math.abs));
  return maxVal === 0 ? audioData : new Float32Array(audioData.map(x => x / maxVal));
};

export const trimSilence = (audioData: Float32Array, threshold = 0.01): Float32Array => {
  let startIdx = 0;
  let endIdx = audioData.length - 1;

  // Find start index
  while (startIdx < audioData.length && Math.abs(audioData[startIdx]) < threshold) {
    startIdx++;
  }

  // Find end index
  while (endIdx > startIdx && Math.abs(audioData[endIdx]) < threshold) {
    endIdx--;
  }

  return audioData.slice(startIdx, endIdx + 1);
};

export const splitIntoFrames = (
  audioData: Float32Array,
  frameLength: number,
  hopLength: number
): Float32Array[] => {
  const frames: Float32Array[] = [];
  for (let i = 0; i <= audioData.length - frameLength; i += hopLength) {
    frames.push(audioData.slice(i, i + frameLength));
  }
  return frames;
};

export const reconstructFromFrames = (
  frames: Float32Array[],
  hopLength: number,
  originalLength: number
): Float32Array => {
  const result = new Float32Array(originalLength);
  const overlap = new Float32Array(originalLength).fill(0);

  frames.forEach((frame, i) => {
    const start = i * hopLength;
    frame.forEach((sample, j) => {
      result[start + j] += sample;
      overlap[start + j]++;
    });
  });

  // Normalize overlapping regions
  for (let i = 0; i < result.length; i++) {
    if (overlap[i] > 0) {
      result[i] /= overlap[i];
    }
  }

  return result;
};