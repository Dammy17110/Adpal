// Serverless function: keeps your Gemini API key secret and writes the promo.
const hits = new Map();
const LIMIT = Number(process.env.HOURLY_LIMIT || 12); // promos per person per hour

const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "The app is not set up yet (missing API key)." });

  // simple per-person limit to protect your money
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  if (recent.length >= LIMIT) {
    return res.status(429).json({ error: "You’ve reached the free limit for now. Please try again in an hour." });
  }
  recent.push(now);
  hits.set(ip, recent);

  const b = req.body || {};
  const sell = clean(b.sell, 400);
  if (!sell) return res.status(400).json({ error: "Tell me what you sell first." });

  const photos = (Array.isArray(b.photos) ? b.photos : [])
    .slice(0, 4)
    .filter((p) => typeof p === "string" && p.length < 1500000 && /^[A-Za-z0-9+/=]+$/.test(p));

  const prompt = `You create promo cards that make customers stop scrolling, for small Nigerian businesses.
Business: ${clean(b.biz, 80) || "not given"}
What they sell or do: ${sell}
Address: ${clean(b.addr, 200) || "not given"}
Phone: ${clean(b.phone, 30) || "not given"}
Language: ${clean(b.lang, 20) || "English"}

Return ONLY valid JSON: {"headline":"max 5 punchy words","tagline":"max 12 words that make people want to visit","offers":["3 items, max 3 words each, only things they actually offer"],"caption":"ready-to-post caption with emojis, 4-6 short lines, includes the address and phone if given, a clear call to action, and a few hashtags"}
Never invent prices, discounts, offers, opening hours or details not given. If photos are attached, use them to make the wording match what is visible.`;

  const parts = [
    { text: prompt },
    ...photos.map((data) => ({ inline_data: { mime_type: "image/jpeg", data } })),
  ];

  try {
    const model = process.env.MODEL || "gemini-2.5-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2000 },
      }),
    });
    if (!r.ok) {
      console.error("Gemini error", r.status, await r.text());
      const msg = r.status === 429
        ? "Today’s free AI limit has been reached. Please try again later."
        : "The AI service is busy. Please try again in a moment.";
      return res.status(r.status === 429 ? 429 : 502).json({ error: msg });
    }
    const j = await r.json();
    const text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [])
      .map((x) => x.text || "").join("");
    const m = text.match(/\{[\s\S]*\}/);
    const out = JSON.parse(m[0]);
    return res.status(200).json({
      headline: clean(out.headline, 60),
      tagline: clean(out.tagline, 120),
      offers: (Array.isArray(out.offers) ? out.offers : []).slice(0, 3).map((o) => clean(o, 30)),
      caption: String(out.caption || "").slice(0, 1200),
    });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "Couldn’t make your promo. Please try again." });
  }
};
