import { useCallback, useRef, useEffect } from 'react';

// Sound frequencies for different notification types
const SOUNDS = {
  newOrder: { frequency: 880, duration: 150, repeat: 3 },      // High-pitched alert
  orderReady: { frequency: 660, duration: 200, repeat: 2 },    // Medium tone
  urgent: { frequency: 1000, duration: 100, repeat: 5 },       // Urgent rapid beeps
  success: { frequency: 523, duration: 300, repeat: 1 },       // Pleasant single tone
};

export function useNotificationSound() {
  const audioContextRef = useRef(null);
  const lastSoundTime = useRef(0);

  // Initialize AudioContext on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback((type = 'newOrder') => {
    // Debounce to prevent rapid successive sounds
    const now = Date.now();
    if (now - lastSoundTime.current < 1000) return;
    lastSoundTime.current = now;

    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const sound = SOUNDS[type] || SOUNDS.newOrder;
      
      const playTone = (delay) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = sound.frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + sound.duration / 1000);
        
        oscillator.start(ctx.currentTime + delay);
        oscillator.stop(ctx.currentTime + delay + sound.duration / 1000);
      };

      for (let i = 0; i < sound.repeat; i++) {
        playTone(i * (sound.duration / 1000 + 0.1));
      }
    } catch (err) {
      console.warn('Audio notification failed:', err);
    }
  }, [initAudio]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { playBeep, initAudio };
}

export default useNotificationSound;
