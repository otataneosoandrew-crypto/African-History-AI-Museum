import { GoogleGenAI } from "@google/genai";

// Initialize the AI client
// Note: process.env.GEMINI_API_KEY is injected by the platform
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const MODELS = {
  TEXT: "gemini-3.1-pro-preview",
  FLASH: "gemini-3-flash-preview",
  IMAGE: "gemini-3.1-flash-image-preview",
  MUSIC: "lyria-3-pro-preview",
  VIDEO: "veo-3.1-lite-generate-preview",
  LIVE: "gemini-3.1-flash-live-preview",
  TTS: "gemini-2.5-flash-preview-tts"
};
