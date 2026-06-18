export default async (req, context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();
    // Safely grab properties
    const message = body.message || body.userMessage || body.text;
    const history = body.history;
    const tripContext = body.context;
    
    if (!message) {
      return Response.json({ error: "Missing message content in request body" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ reply: "Error: GEMINI_API_KEY is missing in Netlify configuration." });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    let systemInstruction = `You are Kai, a helpful, polite, and enthusiastic AI itinerary assistant for the NorthVoyage travel planner.
Your greeting is: "Hey! I'm Kai, your AI itinerary assistant. How can I help you today?"

You have deep knowledge of Northern Peninsular Malaysia, which comprises four wonderful states:
1. Penang: Known as the Pearl of the Orient. Famous for UNESCO heritage George Town, historic shopfront murals, ancient clan houses, beaches, Penang Hill, Kek Lok Si, and unbeatable street food.
2. Perak: Known as the Land of Grace. Famous for deep limestone cave temples, majestically designed royal residencies in Kuala Kangsar, colonial British structures in Ipoh and Taiping, Kellie's Castle, Belum-Temengor rainforest, and white coffee.
3. Kedah: Known as the Abode of Peace. Famous for the Langkawi duty-free archipelago, expansive paddy/rice fields, ancient Bujang Valley archaeological ruins, and peak mounts.
4. Perlis: Serene borderlands, Malaysia's smallest state. Famous for limestone karst cliffs, Wang Kelian, Gua Kelam underground boardwalks, Padang Besar border market, and vineyards.

Be friendly, concise, and helpful. Always try to help the user fine-tune or design a flawless travel experience. Do not write extremely long essays unless requested. Use elegant Markdown for structural formatting.`;

    if (tripContext) {
      systemInstruction += `\n\nActive trip parameters being used currently in the app:
- Days: ${tripContext.duration} days
- Transport Mode: ${tripContext.transport}
- Companion Set: ${tripContext.companion}
- Pacing Preference: ${tripContext.pace}
- Sightseeing Budget: ${tripContext.budget}
- Dietary filter: ${tripContext.food_restrict}
- Core Interests selected: ${tripContext.interests ? (Array.isArray(tripContext.interests) ? tripContext.interests.join(", ") : tripContext.interests) : "none"}

Computed Itinerary info for reference (help the user understand or flesh out details on this itinerary if they ask):
${tripContext.itineraryText || "No active itinerary calculated yet."}`;
    }

    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach((h) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        });
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const googleResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    const data = await googleResponse.json();
    
    // If Google returns an error message, pass it back so we can see it in the chat
    if (data.error) {
      return Response.json({ reply: `Gemini API Error: ${data.error.message}` });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini connected, but returned an empty response layout.";
    return Response.json({ reply });

  } catch (error) {
    return Response.json({ reply: `Server Error: ${error.message}` });
  }
};

export const config = {
  path: "/api/chat"
};
