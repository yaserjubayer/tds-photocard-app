// File: photocard-app/netlify/functions/generate-headline.js
export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { text } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!text || text.trim() === "") {
        return { statusCode: 400, body: JSON.stringify({ error: "No text provided" }) };
    }

    // Truncate to first 6000 characters to save tokens while keeping enough context
    const articleContext = text.substring(0, 6000);

    // Prompt engineered to bypass AI detectors and sound like a human editor
    const prompt = `You are a veteran Executive Editor at 'The Dhaka Standard'. 
    Read the following raw article text and write a single, highly engaging headline for a social media photocard. 
    
    CRITICAL RULES FOR BYPASSING AI DETECTORS:
    - Write with a natural, conversational, yet authoritative journalistic tone.
    - Vary your vocabulary and sentence structure. 
    - Absolutely DO NOT use cliché AI words like "delve", "unveil", "explore", "navigating", "testament", or "tapestry".
    - Avoid predictable, robotic phrasing. Make it sound punchy, asymmetrical, and human.
    - Maximum 15 words. 
    - Do not put quotes around the final output.

    Article text:
    ${articleContext}`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7 // Slightly higher temperature for more creative/human-like text
        }
      })
    });

    const data = await aiResponse.json();
    
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error("AI failed to generate a response.");
    }

    const headline = data.candidates[0].content.parts[0].text.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ headline }) 
    };
  } catch (error) {
    console.error("Headline Generation Error:", error.message);
    return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "Failed to generate headline", details: error.message }) 
    };
  }
}