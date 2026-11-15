/**
 * Accessible Text-To-Speech utility for elderly users.
 * Uses Web Speech API with gentle pacing and clear pronunciation.
 */

let isCurrentlySpeaking = false;

export const speak = (text, onEnd) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[Speech] Web Speech API not supported in this browser.');
    return;
  }

  // Cancel any speech in progress
  window.speechSynthesis.cancel();

  if (!text || !text.trim()) return;

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.rate = 0.88; // Gentle, clear speed for senior comprehension
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  // Attempt to select a clear natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.default) && v.lang.startsWith('en')
  );
  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.onstart = () => {
    isCurrentlySpeaking = true;
  };

  utterance.onend = () => {
    isCurrentlySpeaking = false;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    isCurrentlySpeaking = false;
    console.warn('[Speech Error]', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    isCurrentlySpeaking = false;
  }
};

export const isSpeaking = () => isCurrentlySpeaking;

export default {
  speak,
  stopSpeech,
  isSpeaking,
};
