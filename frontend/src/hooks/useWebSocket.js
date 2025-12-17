import { useState, useEffect, useCallback, useRef } from 'react';

// Sound notification URLs - using Web Audio API for reliable playback
const NOTIFICATION_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
const LOYALTY_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg';

export function useWebSocket(room, onMessage) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);

  // Initialize Audio Context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play notification sound - loud and clear
  const playSound = useCallback(async (soundUrl = NOTIFICATION_SOUND_URL, volume = 1.0) => {
    try {
      const audioContext = initAudioContext();
      
      // Resume audio context if suspended (browser policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const response = await fetch(soundUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = audioBuffer;
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.start(0);
    } catch (err) {
      console.error('Audio playback failed:', err);
      // Fallback to HTML5 audio
      try {
        const audio = new Audio(soundUrl);
        audio.volume = volume;
        await audio.play();
      } catch (e) {
        console.error('Fallback audio failed:', e);
      }
    }
  }, [initAudioContext]);

  // Play loud notification for new orders
  const playOrderNotification = useCallback(() => {
    // Play sound multiple times for attention
    playSound(NOTIFICATION_SOUND_URL, 1.0);
    setTimeout(() => playSound(NOTIFICATION_SOUND_URL, 1.0), 500);
  }, [playSound]);

  // Play special sound for loyalty reward
  const playLoyaltyNotification = useCallback(() => {
    playSound(LOYALTY_SOUND_URL, 1.0);
    setTimeout(() => playSound(LOYALTY_SOUND_URL, 0.8), 600);
  }, [playSound]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.REACT_APP_BACKEND_URL?.replace(/^https?:\/\//, '').replace(/\/api$/, '') || window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/${room}`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`WebSocket connected to room: ${room}`);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        
        // Play sound notifications based on event type
        if (data.play_sound) {
          if (data.event === 'order.created') {
            playOrderNotification();
          } else if (data.event === 'loyalty.reward.eligible') {
            playLoyaltyNotification();
          }
        }
        
        // Call the provided callback
        if (onMessage) {
          onMessage(data);
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.onclose = (event) => {
      console.log(`WebSocket disconnected from room: ${room}`, event.reason);
      setIsConnected(false);
      
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [room, onMessage, playOrderNotification, playLoyaltyNotification]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [initAudioContext]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    playOrderNotification,
    playLoyaltyNotification
  };
}

export default useWebSocket;
