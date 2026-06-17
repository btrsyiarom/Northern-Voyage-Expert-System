import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API endpoints
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGeminiClient();
    
    // System instruction defining Kai's persona and state details
    let systemInstruction = `You are Kai, a helpful, polite, and enthusiastic AI itinerary assistant for the NorthVoyage travel planner.
Your greeting is: "Hey! I'm Kai, your AI itinerary assistant. How can I help you today?"

You have deep knowledge of Northern Peninsular Malaysia, which comprises four wonderful states:
1. Penang: Known as the Pearl of the Orient. Famous for UNESCO heritage George Town, historic shopfront murals, ancient clan houses, beaches, Penang Hill, Kek Lok Si, and unbeatable street food.
2. Perak: Known as the Land of Grace. Famous for deep limestone cave temples, majestically designed royal residencies in Kuala Kangsar, colonial British structures in Ipoh and Taiping, Kellie's Castle, Belum-Temengor rainforest, and white coffee.
3. Kedah: Known as the Abode of Peace. Famous for the Langkawi duty-free archipelago, expansive paddy/rice fields, ancient Bujang Valley archaeological ruins, and peak mounts.
4. Perlis: Serene borderlands, Malaysia's smallest state. Famous for limestone karst cliffs, Wang Kelian, Gua Kelam underground boardwalks, Padang Besar border market, and vineyards.

Be friendly, concise, and helpful. Always try to help the user fine-tune or design a flawless travel experience. Do not write extremely long essays unless requested. Use elegant Markdown for structural formatting.`;

    if (context) {
      systemInstruction += `\n\nActive trip parameters being used currently in the app:
- Days: ${context.duration} days
- Transport Mode: ${context.transport}
- Companion Set: ${context.companion}
- Pacing Preference: ${context.pace}
- Sightseeing Budget: ${context.budget}
- Dietary filter: ${context.food_restrict}
- Core Interests selected: ${context.interests ? context.interests.join(", ") : "none"}

Computed Itinerary info for reference (help the user understand or flesh out details on this itinerary if they ask):
${context.itineraryText || "No active itinerary calculated yet."}`;
    }

    // Build contents for @google/genai SDK
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role,
          parts: [{ text: h.content }]
        });
      });
    }
    
    // Add the user's latest query
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "An error occurred when speaking to Gemini." });
  }
});

// Vite Dev Server middleware mode or production static runner
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
