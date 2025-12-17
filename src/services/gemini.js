import { GoogleGenerativeAI } from "@google/generative-ai";

let model = null;

export const initializeGemini = (apiKey, modelName = "gemini-1.5-flash") => {
    if (!apiKey) {
        console.warn("API Key is empty");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the provided model name, defaulting to gemini-1.5-flash if not specified
    model = genAI.getGenerativeModel({ model: modelName });
};

export const fetchAvailableModels = async (apiKey) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || response.statusText);
        }
        const data = await response.json();
        return data.models || [];
    } catch (error) {
        console.error("Failed to list models:", error);
        throw error;
    }
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

        // Fallback logic for 404 Model Not Found
        if (error.message && error.message.includes("404") && !model._fallbackTried) {
            console.warn("Attempting fallback to gemini-pro...");
            // Hacky access to genAI - ideally we should store genAI instance
            // But for quick fix, we just return a specific error message guiding the user
            return "[Model Error: Try 'gemini-pro' in settings or check API key]";
        }

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
