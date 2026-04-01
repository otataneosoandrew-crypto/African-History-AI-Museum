import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { ai, MODELS } from '../services/ai';
import { cn } from '../lib/utils';
import { LiveServerMessage, Modality } from '@google/genai';

export function LiveGuide() {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);

  const startSession = async () => {
    try {
      setIsConnecting(true);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Initialize AudioContext
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are an expert guide at the Heritage African History Museum. You are knowledgeable, respectful, and engaging. You can discuss any era of African history from pre-colonial times to the present. Keep your responses concise and conversational.",
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            // Setup audio capture
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            source.connect(processor);
            processor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const binary = atob(base64Audio);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const pcmData = new Int16Array(bytes.buffer);
              const floatData = new Float32Array(pcmData.length);
              for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 0x7FFF;

              const buffer = audioContextRef.current.createBuffer(1, floatData.length, 16000);
              buffer.copyToChannel(floatData, 0);
              
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              
              const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              source.start(startTime);
              nextStartTimeRef.current = startTime + buffer.duration;
            }

            if (message.serverContent?.interrupted) {
              // Handle interruption logic if needed
            }
          },
          onclose: () => {
            stopSession();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            stopSession();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start Live session:", err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    sessionRef.current?.then((s: any) => s.close());
    sessionRef.current = null;
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-full shadow-2xl transition-all duration-500",
        isActive ? "bg-museum-ink text-white w-auto" : "bg-white text-museum-ink w-16 h-16 justify-center overflow-hidden"
      )}>
        {isActive && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div 
                  key={i}
                  className="w-1 bg-museum-gold rounded-full animate-bounce"
                  style={{ height: '12px', animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <span className="text-sm font-medium whitespace-nowrap">Heritage Guide Live</span>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        )}
        
        <button
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={cn(
            "p-4 rounded-full transition-all duration-300",
            isActive ? "bg-red-500 hover:bg-red-600" : "bg-museum-ink text-white hover:bg-museum-accent",
            isConnecting && "animate-pulse"
          )}
        >
          {isActive ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      </div>
      
      {!isActive && !isConnecting && (
        <div className="absolute -top-12 right-0 bg-white px-3 py-1 rounded-lg shadow-sm border border-museum-ink/5 text-xs font-medium whitespace-nowrap animate-bounce">
          Talk to a Guide
        </div>
      )}
    </div>
  );
}
