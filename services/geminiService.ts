import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey });
};

interface SearchResult {
    songData: any;
    sources: { uri: string; title: string }[];
}

export const searchSongAI = async (query: string): Promise<SearchResult | null> => {
    try {
        const ai = getClient();
        const model = "gemini-2.5-flash"; // Use flash for speed, search tool supported

        // Prompt specifically asks for search and extraction
        const prompt = `
        Search Google for the chords and lyrics of the song "${query}".
        
        Extract the information and format it as a valid JSON object with the following keys:
        - "title": string
        - "artist": string
        - "originalKey": string (e.g., "C", "G")
        - "bpm": number (approximate)
        - "content": string (The lyrics with chords in ChordPro format, e.g., "[G]Amazing [C]Grace")
        
        Rules:
        1. Place chords in square brackets [] immediately before the syllable they change on.
        2. Simplify chords slightly (e.g. use G7 instead of G13).
        3. Include Verse, Chorus, Bridge headers in the content.
        4. RETURN ONLY THE JSON OBJECT. Do not wrap in markdown code blocks.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                // Note: responseMimeType and responseSchema are NOT compatible with googleSearch tools
            }
        });

        // 1. Extract Grounding Metadata (Sources)
        const sources: { uri: string; title: string }[] = [];
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (groundingChunks) {
            groundingChunks.forEach((chunk: any) => {
                if (chunk.web) {
                    sources.push({ uri: chunk.web.uri, title: chunk.web.title });
                }
            });
        }

        // 2. Parse JSON from text
        // The model might return markdown code blocks ```json ... ``` despite instructions, so we clean it.
        let text = response.text || "";
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        // Find the first '{' and last '}' to ensure valid JSON boundaries
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            text = text.substring(firstBrace, lastBrace + 1);
            const songData = JSON.parse(text);
            return { songData, sources };
        }

        return null;

    } catch (error) {
        console.error("Error fetching song from Gemini:", error);
        throw error;
    }
};
