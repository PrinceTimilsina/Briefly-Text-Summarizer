  const express = require("express");
  const fetch = require("node-fetch");
  const cors = require("cors");
  require("dotenv").config();
  const path = require("path");

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(__dirname));
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

  const HF_TOKEN = process.env.HF_TOKEN;

  if (!HF_TOKEN) {
    console.error("ERROR: HF_TOKEN not found in .env file!");
  }

  app.post("/summarize", async (req, res) => {
    const inputText = req.body.text;
    console.log("Received text length:", inputText?.length);
    
    if (!inputText || inputText.length < 50) {
      return res.status(400).json({ error: "Text too short. Minimum 50 characters required." });
    }
    
    try {
      console.log("Calling HuggingFace API...");
      const response = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: inputText }),
        }
      );

      const data = await response.json();
      console.log("HF Response:", data);
      

      if (data.error && data.error.includes("currently loading")) {
        return res.status(503).json({ 
          error: "Model is loading. Please wait 20 seconds and try again.",
          estimated_time: data.estimated_time 
        });
      }
      

      if (data.error) {
        return res.status(500).json({ error: data.error });
      }
      
      res.json(data);
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(3000, () => {
    console.log("Backend running on http://localhost:3000");
    console.log("HF_TOKEN loaded:", HF_TOKEN ? "Yes ✓" : "No ✗");
  }); 