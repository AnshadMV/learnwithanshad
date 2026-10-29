import '@testing-library/jest-dom'

// Mock Web Speech API if not in browser
if (typeof window !== 'undefined' && !window.speechSynthesis) {
  window.speechSynthesis = {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [],
    onvoiceschanged: null,
    paused: false,
    pending: false,
    speaking: false,
  } as unknown as SpeechSynthesis
}

// Mock Web Audio Context
if (typeof window !== 'undefined' && !window.AudioContext) {
  window.AudioContext = class {
    state = 'running'
    createOscillator() {
      return {
        connect: () => {},
        start: () => {},
        stop: () => {},
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      } as any
    }
    createGain() {
      return {
        connect: () => {},
        gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
      } as any
    }
    destination = {} as any
    currentTime = 0
    resume() {
      return Promise.resolve()
    }
  } as any
}
