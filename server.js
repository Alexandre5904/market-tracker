/**
 * Serveur Express local — tourne à l'intérieur de l'app Electron.
 * Sert les fichiers statiques ET les routes API Yahoo Finance.
 * Depuis une machine locale, Yahoo Finance ne bloque pas les requêtes.
 */
const express = require('express');
const path    = require('path');
const app     = express();

// ── Fichiers statiques (index.html, assets…) ──────────────────────────────
app.use(express.static(path.join(__dirname)));

// ── Middleware de base ────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3847');
  next();
});

// ── Charge un handler API (Vercel-style) dans Express ─────────────────────
// Les handlers existants utilisent req.query / res.json / res.status :
// tout est compatible Express nativement.
function apiRoute(handlerPath) {
  // On charge le module une seule fois (Node cache) →
  // le crumb Yahoo Finance persiste entre les requêtes.
  const handler = require(handlerPath);
  return (req, res) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch((err) => {
        console.error(`[API] ${handlerPath}:`, err.message);
        if (!res.headersSent) res.status(500).json({ error: err.message });
      });
  };
}

app.get('/api/company', apiRoute('./api/company'));
app.get('/api/history', apiRoute('./api/history'));
app.get('/api/quotes',  apiRoute('./api/quotes'));
app.get('/api/search',  apiRoute('./api/search'));

// ── Toute autre route → index.html (SPA) ──────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = app;
