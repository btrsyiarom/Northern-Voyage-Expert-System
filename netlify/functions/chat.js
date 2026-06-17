export default async (req, context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const { message } = await req.json();
    if (!message) {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "API Key not configured in Netlify Settings" }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const googleResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await googleResponse.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

    return Response.json({ reply });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};

export const config = {
  path: "/api/chat"
};
