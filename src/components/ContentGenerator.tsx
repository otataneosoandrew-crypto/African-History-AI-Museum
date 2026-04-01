import React, { useState } from 'react';
import { 
  Music, 
  FileText, 
  Video, 
  BookOpen, 
  Mic, 
  Loader2, 
  Download, 
  Play, 
  Pause,
  Sparkles,
  Search,
  Globe
} from 'lucide-react';
import { ai, MODELS } from '../services/ai';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import Markdown from 'react-markdown';
import { GenerateContentResponse, Modality, Type } from '@google/genai';

interface ContentGeneratorProps {
  era: string;
  topic: string;
}

export function ContentGenerator({ era, topic }: ContentGeneratorProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; content: any; grounded?: boolean } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const generatePoem = async () => {
    setLoading('poem');
    try {
      const response = await ai.models.generateContent({
        model: MODELS.FLASH,
        contents: `Write a powerful, evocative poem about ${topic} during the ${era} era of African history. Use rich imagery and cultural references.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      setResult({ 
        type: 'poem', 
        content: response.text,
        grounded: !!response.candidates?.[0]?.groundingMetadata 
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const generatePodcast = async () => {
    setLoading('podcast');
    try {
      // 1. Generate Script
      const scriptResponse = await ai.models.generateContent({
        model: MODELS.FLASH,
        contents: `Create a 1-minute podcast script about ${topic} in the ${era} era. Include an intro, key historical facts, and a concluding thought.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      
      // 2. Generate Audio (TTS)
      const ttsResponse = await ai.models.generateContent({
        model: MODELS.TTS,
        contents: [{ parts: [{ text: scriptResponse.text || "" }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
          }
        }
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioUrl = `data:audio/wav;base64,${base64Audio}`;
        setResult({ 
          type: 'podcast', 
          content: { script: scriptResponse.text, audioUrl },
          grounded: !!scriptResponse.candidates?.[0]?.groundingMetadata
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const generateSong = async () => {
    setLoading('song');
    try {
      const response = await ai.models.generateContentStream({
        model: MODELS.MUSIC,
        contents: `Generate a full-length traditional African inspired song about ${topic} during the ${era}. Include rhythmic percussion and soulful melodies.`,
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) lyrics = part.text;
        }
      }

      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      
      setResult({ type: 'song', content: { lyrics, audioUrl } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const generateStoryBook = async () => {
    setLoading('storybook');
    try {
      // 1. Generate Story Content
      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: `Create a beautifully written historical storybook content for children about ${topic} in the ${era}. Include 5 short chapters with titles.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING }
              }
            }
          }
        }
      });

      const chapters = JSON.parse(response.text || "[]");
      
      // 2. Create PDF
      const doc = new jsPDF();
      doc.setFont("times", "bold");
      doc.setFontSize(24);
      doc.text("Heritage Storybook", 105, 40, { align: "center" });
      doc.setFontSize(18);
      doc.text(topic, 105, 55, { align: "center" });
      
      chapters.forEach((ch: any, i: number) => {
        doc.addPage();
        doc.setFontSize(16);
        doc.text(ch.title, 20, 30);
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(ch.content, 170);
        doc.text(splitText, 20, 45);
      });

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setResult({ type: 'storybook', content: { chapters, pdfUrl } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const generateVideo = async () => {
    setLoading('video');
    try {
      // 1. Generate Image first
      const imgResponse = await ai.models.generateContent({
        model: MODELS.IMAGE,
        contents: { parts: [{ text: `A cinematic, high-quality historical depiction of ${topic} in Africa during the ${era}. Realistic style, epic lighting.` }] },
        config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
      });

      let base64Img = "";
      for (const part of imgResponse.candidates[0].content.parts) {
        if (part.inlineData) base64Img = part.inlineData.data;
      }

      // 2. Generate Video from Image
      let operation = await ai.models.generateVideos({
        model: MODELS.VIDEO,
        prompt: `Cinematic movement showing ${topic} in historical Africa.`,
        image: { imageBytes: base64Img, mimeType: 'image/png' },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      const videoResponse = await fetch(downloadLink!, {
        method: 'GET',
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY || "" },
      });
      const videoBlob = await videoResponse.blob();
      const videoUrl = URL.createObjectURL(videoBlob);

      setResult({ type: 'video', content: { videoUrl, imageUrl: `data:image/png;base64,${base64Img}` } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { id: 'podcast', icon: Mic, label: 'Podcast', action: generatePodcast },
          { id: 'song', icon: Music, label: 'Song', action: generateSong },
          { id: 'poem', icon: FileText, label: 'Poem', action: generatePoem },
          { id: 'video', icon: Video, label: 'Film', action: generateVideo },
          { id: 'storybook', icon: BookOpen, label: 'StoryBook', action: generateStoryBook },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={tool.action}
            disabled={!!loading}
            className={cn(
              "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all",
              loading === tool.id 
                ? "bg-museum-ink text-white border-museum-ink" 
                : "bg-white border-museum-ink/10 hover:border-museum-accent hover:shadow-md"
            )}
          >
            {loading === tool.id ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <tool.icon size={24} />
            )}
            <span className="text-xs font-bold uppercase tracking-widest">{tool.label}</span>
          </button>
        ))}
      </div>

      {result && (
        <div className="museum-card animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-serif italic capitalize">{result.type} Result</h3>
            <button 
              onClick={() => setResult(null)}
              className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100"
            >
              Clear
            </button>
          </div>

          {result.type === 'poem' && (
            <div className="max-w-2xl mx-auto">
              {result.grounded && (
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-4 justify-center">
                  <Globe size={12} /> Grounded with Google Search
                </div>
              )}
              <div className="markdown-body font-serif text-lg leading-relaxed text-center italic">
                <Markdown>{result.content}</Markdown>
              </div>
            </div>
          )}

          {(result.type === 'podcast' || result.type === 'song') && (
            <div className="space-y-6">
              {result.grounded && (
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-500 justify-center">
                  <Globe size={12} /> Grounded with Google Search
                </div>
              )}
              <div className="bg-museum-bg p-8 rounded-xl flex flex-col items-center gap-4">
                <audio 
                  ref={audioRef} 
                  src={result.content.audioUrl} 
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  controls
                  className="w-full"
                />
                <div className="flex gap-4">
                  <a 
                    href={result.content.audioUrl} 
                    download={`${topic}-${result.type}.wav`}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Download size={16} /> Download Audio
                  </a>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto p-6 bg-white border border-museum-ink/5 rounded-xl text-sm leading-relaxed">
                <h4 className="font-bold mb-2 uppercase tracking-widest text-[10px] opacity-50">Content / Lyrics</h4>
                <div className="markdown-body italic">
                  <Markdown>{result.type === 'podcast' ? result.content.script : result.content.lyrics}</Markdown>
                </div>
              </div>
            </div>
          )}

          {result.type === 'storybook' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.content.chapters.map((ch: any, i: number) => (
                  <div key={i} className="p-4 border border-museum-ink/5 rounded-xl bg-museum-bg/50">
                    <h4 className="font-serif font-bold mb-1">{ch.title}</h4>
                    <p className="text-sm opacity-70 line-clamp-3">{ch.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <a 
                  href={result.content.pdfUrl} 
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary flex items-center gap-2"
                >
                  <Download size={18} /> Download StoryBook PDF
                </a>
              </div>
            </div>
          )}

          {result.type === 'video' && (
            <div className="space-y-6">
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                <video 
                  src={result.content.videoUrl} 
                  controls 
                  autoPlay 
                  loop 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-center">
                <a 
                  href={result.content.videoUrl} 
                  download={`${topic}-film.mp4`}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download size={18} /> Save Film
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
