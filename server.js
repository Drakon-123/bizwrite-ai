require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Access keys — add more as you sell
const validKeys = new Set([
  "BW-L7SQ-FCBZ-XJYF-DBFS",
  "BW-SRD7-LU9S-DS9P-Q8YD",
  "BW-3RJJ-DLFG-X73C-G4EV",
  "BW-D3VX-MHQX-XLEY-39Y2",
  "BW-XBHP-LYUA-QFBE-K6RX",
  "BW-SF52-P4PM-F8X6-WZ7N",
  "BW-CKBA-HLFN-E9SH-FVFH",
  "BW-6HL4-KE2G-6PWX-WYR8",
  "BW-URBF-EBBH-BTUR-RL53",
  "BW-N7G4-QNTU-3HT7-PK22",
  "BW-ZFKX-PJWC-7LR4-B3FF",
  "BW-UVNA-WMX9-RLUY-RB3Y",
  "BW-BY9A-EN67-RAPA-6JR6",
  "BW-4XKE-2MYG-VHPB-CD7S",
  "BW-FFY3-PMUX-WZNK-SQGB",
  "BW-B6ME-YRZ5-F2WE-DFL6",
  "BW-LYHL-5AKV-73V6-AEUY",
  "BW-DUG7-RKL8-69C2-GHXM",
  "BW-MPCM-SXRB-T7R4-K3RF",
  "BW-GZZD-552H-FAYS-4VNA"
]);

const usedKeys = new Set();

app.post("/verify-key", (req, res) => {
  const { key } = req.body;
  const cleanKey = key.trim().toUpperCase();

  if (validKeys.has(cleanKey) && !usedKeys.has(cleanKey)) {
    usedKeys.add(cleanKey);
    res.json({ valid: true });
  } else if (usedKeys.has(cleanKey)) {
    res.json({ valid: false, reason: "This key has already been used." });
  } else {
    res.json({ valid: false, reason: "Invalid access key." });
  }
});

app.post("/generate", async (req, res) => {
  const { prompt, key } = req.body;

  if (!key) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    const text = completion.choices[0].message.content;
    res.json({ result: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));