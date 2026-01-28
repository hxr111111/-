import { GoogleGenAI } from "@google/genai";
import { Video, VideoCategory } from "../types";

const apiKey = process.env.API_KEY;

// Initialize the client only if the key is available
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateVideoSummary = async (video: Video, extraContext?: string): Promise<string> => {
  if (!ai) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const prompt = `
    I need a comprehensive summary and study guide for a video.
    
    **Video Metadata:**
    - Title: ${video.title}
    - Category: ${video.category}
    - User Tags: ${video.tags.join(', ')}
    - User Notes/Context: ${video.notes || "None provided"}
    
    ${extraContext ? `**Additional Context (Transcript/Description):**\n${extraContext}` : ''}

    **Task:**
    1. Search for this video online (using the title and context) to understand its content if possible.
    2. Provide a structured summary of what this video likely covers.
    3. List 3-5 key takeaways or learning points.
    4. If it's a tutorial, suggest a brief practice exercise.
    
    Output in Markdown format. Keep it concise but informative.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Use Grounding to find info about the video URL/Title
        systemInstruction: "You are an intelligent video library assistant. Your goal is to help the user learn efficiently by summarizing video content and extracting key insights.",
        temperature: 0.3, // Lower temperature for more factual output
      }
    });

    return response.text || "Sorry, I couldn't generate a summary at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service. Please try again later.";
  }
};

export const generateSuggestions = async (title: string): Promise<{ tags: string[], category: string }> => {
  if (!ai) return { tags: [], category: '' };

  const prompt = `Based on the video title "${title}", suggest 3-5 relevant tags and the most appropriate category from this list: [编程开发, 健身运动, 语言学习, 设计艺术, 商业财经, 科普知识, 娱乐休闲, 其他]. Return ONLY a JSON object: {"tags": ["tag1", "tag2"], "category": "CategoryName"}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return { tags: [], category: '' };
    return JSON.parse(text);
  } catch (e) {
    console.error(e);
    return { tags: [], category: '' };
  }
};

// New Function: Smart Extract from URL
export const extractVideoMetadata = async (url: string): Promise<{ title: string, category: VideoCategory, tags: string[], notes: string }> => {
  if (!ai) throw new Error("API Key missing");

  const categories = Object.values(VideoCategory).join(', ');
  
  const prompt = `
    Analyze the following video URL: ${url}
    
    Task:
    1. Use Google Search to find the real title, content, and context of this video.
    2. Extract the video Title.
    3. Determine the best Category from this exact list: [${categories}]. If unsure, use "其他".
    4. Generate 3-5 relevant Tags.
    5. Write a brief 1-2 sentence summary for the "notes" field explaining what this video is about.

    IMPORTANT: Return the result as a raw JSON object string. Do not use Markdown formatting.
    Format:
    {
      "title": "string",
      "category": "string",
      "tags": ["string", "string"],
      "notes": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json" is NOT supported with tools, so we parse manually
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Sanitize input in case model adds markdown code blocks
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(text);
    return {
      title: data.title || "",
      category: Object.values(VideoCategory).includes(data.category) ? data.category : VideoCategory.OTHER,
      tags: data.tags || [],
      notes: data.notes || ""
    };
  } catch (error) {
    console.error("Metadata extraction failed:", error);
    throw new Error("无法自动提取视频信息，请手动输入。");
  }
};

// New Function: Semantic Search
export const semanticSearchVideos = async (query: string, videos: Video[]): Promise<string[]> => {
  if (!ai) return [];
  if (videos.length === 0) return [];

  // Create a simplified index to save tokens
  const videoIndex = videos.map(v => ({
    id: v.id,
    title: v.title,
    tags: v.tags,
    category: v.category,
    notes: v.notes,
    status: v.status
  }));

  const prompt = `
    User Query: "${query}"

    Below is a list of videos in the user's library (JSON format). 
    Identify which videos best match the user's intent or description in the query.
    Consider semantic meaning, not just keyword matching.
    
    Library:
    ${JSON.stringify(videoIndex)}

    Return a JSON object containing an array of matching video IDs sorted by relevance.
    Example: { "ids": ["id_1", "id_2"] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];
    const result = JSON.parse(text);
    return result.ids || [];
  } catch (error) {
    console.error("Semantic search failed:", error);
    return [];
  }
};