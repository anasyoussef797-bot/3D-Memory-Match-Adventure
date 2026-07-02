// Vercel Serverless Function proxying to Google Translate TTS
export default async function handler(req, res) {
  try {
    const { text, lang = 'en' } = req.query;

    if (!text) {
      return res.status(400).json({ error: "Text query parameter is required" });
    }

    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;

    const response = await fetch(googleTtsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Google TTS service returned status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day client side caching
    res.status(200).send(buffer);
  } catch (error) {
    console.error("Vercel Serverless TTS proxy error:", error);
    res.status(500).json({ error: error.message || "TTS generation failed" });
  }
}
