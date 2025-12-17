import { GoogleGenerativeAI } from "@google/generative-ai";

let model = null;

export const initializeGemini = (apiKey) => {
    if (!apiKey) {
        console.warn("API Key is empty");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Try using the specific version, or fallback to pro if needed in logic
    // For now, let's switch to 'gemini-1.5-flash-001' which is more stable than the alias in some regions/keys
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
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
