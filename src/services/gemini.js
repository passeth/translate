import { GoogleGenerativeAI } from "@google/generative-ai";

let model = null;

export const initializeGemini = (apiKey) => {
  if (!apiKey) {
    console.warn("API Key is empty");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

export const translateText = async (text, targetLangName) => {
  if (!model) return "[API Key Invalid/Missing] " + text;
  
  try {
    const prompt = `Translate the following text into ${targetLangName}. Output ONLY the translated text, do not include any other commentary.
    Text: "${text}"`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Translation error:", error);
    return "[Translation Error]";
  }
};

export const summarizeLogs = async (logs) => {
    if (!model) return "API Key missing. Cannot summarize.";
    if (logs.length === 0) return "No new content to summarize.";

    try {
        const textData = logs.map(l => `[Speaker: ${l.speaker}]: ${l.original} (Translated: ${l.translated})`).join("\n");
        const prompt = `Summarize the following meeting conversation efficiently. 
        Focus on key decisions, numbers, and action items. 
        Output the summary in Korean (Host Language) unless clearly requested otherwise.
        
        Conversation Chunk:
        ${textData}`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Summary error:", error);
        return "Summary generation failed.";
    }
}
