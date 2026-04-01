// ============================================================
//  KEY VALIDATION SERVER
//  npm install express cors
//  Run this on a VPS / Railway / Render etc.
// ============================================================

const express = require("express");
const cors    = require("cors");
const fs      = require("fs");

const app    = express();
const PORT   = process.env.PORT || 3000;
const DB_PATH = "./keys.json";   // same file as the bot, or put both in same folder

app.use(cors());
app.use(express.json());

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ── POST /validate ──────────────────────────────────────────
// Body: { key, hwid }
// Returns: { success, message }
app.post("/validate", (req, res) => {
  const { key, hwid } = req.body;
  if (!key || !hwid) return res.json({ success: false, message: "Missing key or hwid." });

  const db = loadDB();
  const k  = db[key.toUpperCase()];

  if (!k)          return res.json({ success: false, message: "Invalid key." });
  if (!k.active)   return res.json({ success: false, message: "Key has been revoked." });
  if (k.expiry && new Date() > new Date(k.expiry))
                   return res.json({ success: false, message: "Key has expired." });

  // HWID lock
  if (k.hwid && k.hwid !== hwid)
    return res.json({ success: false, message: "HWID mismatch. Contact support to reset." });

  // First use — lock to this HWID
  if (!k.hwid) {
    k.hwid = hwid;
    k.firstUsed = new Date().toISOString();
    saveDB(db);
  }

  return res.json({ success: true, message: "Authorized." });
});

app.listen(PORT, () => console.log(`Key server running on port ${PORT}`));