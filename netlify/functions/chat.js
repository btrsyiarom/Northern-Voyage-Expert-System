export default async (req, context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();
    // Safely grab the text message whether your frontend named it 'message', 'userMessage', or 'text'
    const message = body.message || body.userMessage || body.text;
    
    if (!message) {
      return Response.json({ error: "Missing message content in request body" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ reply: "Error: GEMINI_API_KEY is missing in Netlify configuration." });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const systemInstruction = "You are Kai, an expert AI travel planning system specializing exclusively in Northern Malaysia (Penang, Kedah, Perlis, and Langkawi). Provide detailed, structured, day-by-day travel itineraries. Keep your tone enthusiastic, welcoming, and helpful.";

    const googleResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemInstruction}\n\nUser Request: ${message}` }] }]
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
