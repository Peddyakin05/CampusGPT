const GEMMA_MODEL = "gemma-4-26b-a4b-it";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: "GOOGLE_API_KEY is not configured on the server." }
    });
  }

  try {
    const googleRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      }
    );

    const text = await googleRes.text();
    res.status(googleRes.status);
    res.setHeader("Content-Type", googleRes.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (err) {
    return res.status(502).json({
      error: { message: "Gemma proxy request failed." }
    });
  }
};
