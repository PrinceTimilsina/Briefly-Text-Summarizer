import fetch from "node-fetch";

const HF_TOKEN = process.env.HF_TOKEN;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  if (!text || text.length < 50) {
    return res.status(400).json({ error: "Text too short. Minimum 50 characters required." });
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    const data = await response.json();

    if (data.error && data.error.includes("currently loading")) {
      return res.status(503).json({
        error: "Model is loading. Please wait 20 seconds and try again.",
        estimated_time: data.estimated_time
      });
    }

    if (data.error) return res.status(500).json({ error: data.error });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
