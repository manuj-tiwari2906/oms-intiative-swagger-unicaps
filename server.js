import express from 'express';
import newman from 'newman';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5174; // Changed to 5174

app.use(express.json({ limit: '10mb' }));

// CORS for Vite dev server (5173)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve static files (Vite build or dev)
app.use(express.static(path.join(__dirname, 'dist')));

// Run Newman collection
app.post('/api/run-collection', async (req, res) => {
  try {
    const { collection, environment } = req.body;
    // Write temp files
    const collectionPath = path.join(__dirname, 'tmp_collection.json');
    fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
    let envPath = null;
    if (environment) {
      envPath = path.join(__dirname, 'tmp_env.json');
      fs.writeFileSync(envPath, JSON.stringify(environment, null, 2));
    }
    // Run newman
    newman.run({
      collection: collectionPath,
      environment: envPath,
      reporters: 'json',
      timeoutRequest: 30000,
    }, (err, summary) => {
      // Clean up temp files
      fs.unlinkSync(collectionPath);
      if (envPath) fs.unlinkSync(envPath);
      if (err) {
        // Always send a valid JSON response
        res.status(500).json({ error: err.message });
      } else {
        try {
          // If summary is not a plain object, try to parse
          if (typeof summary === 'string') {
            res.json(JSON.parse(summary));
          } else {
            res.json(summary);
          }
        } catch (e) {
          res.status(200).json({ error: 'Newman run completed, but response could not be parsed', details: String(e), raw: summary });
        }
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
