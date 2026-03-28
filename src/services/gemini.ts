import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getChatResponse(
  prompt: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  language: string = 'English'
) {
  const contents = [
    ...history.map(h => ({
      role: h.role,
      parts: h.parts
    })),
    { role: 'user', parts: [{ text: prompt }] }
  ];

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction: `You are a supportive, empathetic, and professional mental health AI assistant for college students. 
      Your goal is to provide a safe space for students to talk about their stress, anxiety, and wellness. 
      You are not a replacement for professional therapy. If a user is in crisis, strongly encourage them to seek professional help.
      IMPORTANT: Please respond in ${language}. If the language is Hindi, Kannada, Telugu, or Tamil, use the respective script.`,
    }
  });

  return result.text || "I'm sorry, I couldn't process that.";
}

export async function generateSpeech(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this clearly and empathetically: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}
