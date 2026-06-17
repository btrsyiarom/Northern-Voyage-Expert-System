/**
 * Netlify serverless function proxying messages to Gemini REST API.
 * Route: /api/chat (via rewrite rule defined in netlify.toml)
 */

exports.handler = async function (event, context) {
  // Handle CORS Preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { message, history, context: clientContext } = JSON.parse(event.body || "{}");

    if (!message) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Message is required." }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "GEMINI_API_KEY is not configured in Netlify environment variables." }),
      };
    }

    // Build Kai's persona instructions & dynamic itinerary parameters context
    let systemInstruction = `You are Kai, a helpful, polite, and enthusiastic AI itinerary assistant for the NorthVoyage travel planner.
Your greeting is: "Hey! I'm Kai, your AI itinerary assistant. How can I help you today?"

You have deep knowledge of Northern Peninsular Malaysia, which comprises four wonderful states:
1. Penang: Known as the Pearl of the Orient. Famous for UNESCO heritage George Town, historic shopfront murals, ancient clan houses, beaches, Penang Hill, Kek Lok Si, and unbeatable street food.
2. Perak: Known as the Land of Grace. Famous for deep limestone cave temples, majestically designed royal residencies in Kuala Kangsar, colonial British structures in Ipoh and Taiping, Kellie's Castle, Belum-Temengor rainforest, and white coffee.
3. Kedah: Known as the Abode of Peace. Famous for the Langkawi duty-free archipelago, expansive paddy/rice fields, ancient Bujang Valley archaeological ruins, and peak mounts.
4. Perlis: Serene borderlands, Malaysia's smallest state. Famous for limestone karst cliffs, Wang Kelian, Gua Kelam underground boardwalks, Padang Besar border market, and vineyards.

Be friendly, concise, and helpful. Always try to help the user fine-tune or design a flawless travel experience. Do not write extremely long essays unless requested. Use elegant Markdown for structural formatting.`;

    if (clientContext) {
      systemInstruction += `\n\nActive trip parameters being used currently in the app:
- Days: ${clientContext.duration} days
- Transport Mode: ${clientContext.transport}
- Companion Set: ${clientContext.companion}
- Pacing Preference: ${clientContext.pace}
- Sightseeing Budget: ${clientContext.budget}
- Dietary filter: ${clientContext.food_restrict}
- Core Interests selected: ${clientContext.interests ? clientContext.interests.join(", ") : "none"}

Computed Itinerary info for reference (help the user understand or flesh out details on this itinerary if they ask):
${clientContext.itineraryText || "No active itinerary calculated yet."}`;
    }

    // Frame content messages formatted for official Gemini REST standard
    const contents = [];

    // Map history to official array schema
    if (history && Array.isArray(history)) {
      history.forEach((h) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        });
      });
    }

    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return {
        statusCode: apiResponse.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Gemini REST API reported error: ${errorText}` }),
      };
    }

    const data = await apiResponse.json();
    
    // Extract generation part text from candidates response
    let replyText = "";
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      replyText = data.candidates[0].content.parts[0].text;
    } else {
      replyText = "Active assistant connection succeeded, but no answer parts was processed.";
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ response: replyText }),
    };

  } catch (error) {
    console.error("Netlify serverless function proxy error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "An internal proxy exception occurred." }),
    };
  }
};
