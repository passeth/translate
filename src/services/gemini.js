import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
let translationModel = null;

export const initializeGemini = (apiKey, modelName = "gemini-1.5-flash") => {
    if (!apiKey) {
        console.warn("API Key is empty");
        return;
    }
    genAI = new GoogleGenerativeAI(apiKey);
    // Translation Model
    translationModel = genAI.getGenerativeModel({ model: modelName });
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

export const translateText = async (text, sourceLangName, targetLangName) => {
    if (!translationModel) return "[API Key Invalid/Missing] " + text;

    try {
        const prompt = `Translate the following text from ${sourceLangName} into ${targetLangName}. Output ONLY the translated text, do not include any other commentary.
    Text: "${text}"`;
        const result = await translationModel.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Translation error:", error);

        if (error.message && error.message.includes("404")) {
            return "[Model Error: Check Settings]";
        }

        return "[Translation Error]";
    }
};

export const summarizeLogs = async (logs, summaryModelName = "gemini-1.5-flash", customPrompt = "") => {
    if (!genAI) return "API Key missing. Cannot summarize.";
    if (logs.length === 0) return "No new content to summarize.";

    try {
        const summaryModel = genAI.getGenerativeModel({ model: summaryModelName });

        const textData = logs.map(l => `[${l.speaker}]: ${l.original}`).join("\n");

        const defaultPrompt = `Summarize the following meeting conversation efficiently. Focus on key decisions, numbers, and action items. Output the summary in Korean.`;

        const finalInputs = customPrompt ? customPrompt : defaultPrompt;

        const prompt = `${finalInputs}

        Conversation Logs:
        ${textData}`;

        const result = await summaryModel.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Summary error:", error);
        return "Summary generation failed: " + error.message;
    }
}
