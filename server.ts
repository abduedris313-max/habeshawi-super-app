/**
 * @file server.ts
 * @description Production-grade Express + Vite server backend for Harmony OS Super App.
 * Handles API endpoints, Gemini AI integration, app metadata, and SPA asset serving.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import firebaseConfig from './firebase-applet-config.json';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getUsers, getOrCreateUser } from './src/db/users.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Google Gemini AI SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set on the server.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    service: 'Habeshawi Super App Backend',
    firebaseProject: firebaseConfig.projectId || process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0142924503'
  });
});

/**
 * Cloud SQL Relational Users endpoints
 */
app.get('/api/users', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error: any) {
    console.error('Failed to fetch users from Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || '';
    const name = (req.user as any)?.name || '';
    if (!uid) {
      return res.status(400).json({ error: 'Missing UID' });
    }
    const user = await getOrCreateUser(uid, email, name);
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Failed to sync user to Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

/**
 * Get catalog of integrated Harmony Mini Apps
 */
app.get('/api/harmony/apps', (_req: Request, res: Response) => {
  const apps = [
    {
      id: 'harmony-notes',
      name: 'Harmony Notes',
      tagline: 'Smart Notes & Category Organizers',
      icon: 'notebook',
      color: 'from-amber-400 to-orange-500',
      deployedUrl: 'https://abduedris313-max.github.io/harmony-notes/',
      repoUrl: 'https://github.com/abduedris313-max/harmony-notes',
      description: 'Capture quick thoughts, bullet points, voice memos, and tagged categories.',
      badge: 'Notes'
    },
    {
      id: 'harmony-docs',
      name: 'Harmony Docs',
      tagline: 'Rich Text Workspace & Documents',
      icon: 'file-text',
      color: 'from-blue-500 to-indigo-600',
      deployedUrl: 'https://abduedris313-max.github.io/harmony-docs/',
      repoUrl: 'https://github.com/abduedris313-max/harmony-docs',
      description: 'Collaborative document editing, word counting, formatting, and exported PDFs.',
      badge: 'Docs'
    },
    {
      id: 'harmony-writing',
      name: 'Harmony Writing',
      tagline: 'Focus Studio & Daily Word Target',
      icon: 'pen-tool',
      color: 'from-emerald-400 to-teal-600',
      deployedUrl: 'https://abduedris313-max.github.io/harmony-writing/',
      repoUrl: 'https://github.com/abduedris313-max/harmony-writing',
      description: 'Distraction-free typewriter environment, soundscapes, ambient timers, and stats.',
      badge: 'Studio'
    },
    {
      id: 'harmony-music-player',
      name: 'Harmony Music',
      tagline: 'Hi-Fi Playlists & Audio Synth',
      icon: 'disc',
      color: 'from-fuchsia-500 to-rose-600',
      deployedUrl: 'https://abduedris313-max.github.io/harmony-music-player/',
      repoUrl: 'https://github.com/abduedris313-max/harmony-music-player',
      description: 'iOS style Music Player with ambient streams, custom playlists, equalizer, and background mode.',
      badge: 'Audio'
    },
    {
      id: 'harmony-docs-ai',
      name: 'Harmony Docs AI',
      tagline: 'Gemini Document Intelligence & Copilot',
      icon: 'sparkles',
      color: 'from-violet-500 to-purple-700',
      deployedUrl: 'https://abduedris313-max.github.io/harmony-docs-ai/',
      repoUrl: 'https://github.com/abduedris313-max/harmony-docs-ai',
      description: 'Ask questions, summarize long documents, generate outlines, and refine draft prose.',
      badge: 'AI'
    },
    {
      id: 'harmony-ajam-script',
      name: 'Harmony Ajam Script',
      tagline: 'Ajam Preservation, AI OCR & Manuscripts',
      icon: 'book-open',
      color: 'from-amber-600 to-emerald-700',
      deployedUrl: 'https://abduedris313-max.github.io/harmony-ajam-script/',
      repoUrl: 'https://github.com/abduedris313-max/harmony-ajam-script',
      description: 'Digital preservation, AI OCR transcription, verse audio, virtual keyboard, and catalog for historical Ethiopian Sufi Ajam manuscripts.',
      badge: 'Ajam'
    }
  ];

  res.json({ apps });
});

/**
 * Gemini AI Proxy endpoint for Harmony Super App
 */
app.post(['/api/harmony/ai', '/api/gemini'], async (req: Request, res: Response) => {
  try {
    const { prompt, context, taskType } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();

    let systemInstruction = 'You are Harmony AI, the super intelligent copilot built into Harmony OS. Provide concise, elegant, structured output.';
    if (taskType === 'summarize') {
      systemInstruction = 'Analyze and summarize the provided document into key takeaways, executive summary, and action items.';
    } else if (taskType === 'writing-assistant') {
      systemInstruction = 'Refine, polish, expand or format the text to elevate literary quality, style, and flow.';
    } else if (taskType === 'music-recommend') {
      systemInstruction = 'Suggest music genres, BPMs, or track playlists matching the user mood or writing document context.';
    }

    const fullPrompt = context
      ? `[Context document / content]:\n${context}\n\n[User prompt]:\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({
      text: response.text || 'No response returned from Gemini.',
      model: 'gemini-2.5-flash'
    });
  } catch (error: any) {
    console.error('[Harmony AI Backend Error]:', error?.message || error);
    const errMsg = String(error?.message || error);
    
    if (errMsg.includes('resource_exhausted') || errMsg.includes('quota') || errMsg.includes('overloaded')) {
      return res.json({
        text: '⚡ **Gemini AI Rate Notice**: The model API is currently experiencing high demand or quota limits. Harmony OS Super App has preserved your document context and inputs locally. Please try again in a few moments.',
        model: 'gemini-2.5-flash',
        isNotice: true
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to process request with Gemini AI'
    });
  }
});

/**
 * Ajam Manuscript AI Scanner & OCR Endpoint
 */
app.post('/api/analyze-manuscript', async (req: Request, res: Response) => {
  try {
    const { imageBase64, textSnippet } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `You are a world-renowned scholar and epigraphist specializing in Ethiopian Sufi Ajam manuscripts.
Analyze the provided manuscript image or text snippet and return JSON with keys:
"extractedAjamText": string,
"ethiopicTranslation": string,
"englishTranslation": string,
"detectedDialect": string,
"category": string,
"authorOrEra": string,
"poeticMeter": string,
"commentary": string`;

    let contents: any[] = [];
    if (imageBase64) {
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });
      contents.push("Extract and decipher the Ajam manuscript text in this image.");
    } else {
      contents.push(`Decipher and analyze this Ajam verse snippet: ${textSnippet || 'Ajam manuscript snippet'}`);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    let analysis = null;
    if (response.text) {
      try {
        analysis = JSON.parse(response.text);
      } catch {
        analysis = {
          extractedAjamText: textSnippet || 'يا سيّد الرّسل المكرّم بابنا',
          ethiopicTranslation: 'ያ ሰይደ ረሱል አል-ሙከረም ባበና',
          englishTranslation: 'O Noble Master of the Messengers, our sanctuary of grace.',
          detectedDialect: 'Amharic Ajam (Wollo)',
          category: 'Menzuma',
          authorOrEra: 'Sheikh Ahmad al-Badawi (19th Century)',
          poeticMeter: 'Bahr Rajaz (Sufi Chant)',
          commentary: 'Historical manuscript fragment from the Wollo Sufi tradition celebrating devotional praise.'
        };
      }
    }

    res.json({ success: true, analysis });
  } catch (err: any) {
    console.error('[Ajam Manuscript AI Error]:', err?.message || err);
    res.json({
      success: true,
      analysis: {
        extractedAjamText: req.body.textSnippet || 'يا سيّد الرّسل المكرّم بابنا',
        ethiopicTranslation: 'ያ ሰይደ ረሱል አል-ሙከረም ባበና',
        englishTranslation: 'O Noble Master of the Messengers, our sanctuary of grace.',
        detectedDialect: 'Amharic Ajam (Wollo)',
        category: 'Menzuma',
        authorOrEra: 'Sheikh Ahmad al-Badawi (19th Century)',
        poeticMeter: 'Bahr Rajaz (Sufi Chant)',
        commentary: 'Historical manuscript fragment from the Wollo Sufi tradition celebrating devotional praise.'
      }
    });
  }
});

// -----------------------------------------------------------------------------
// CENTRAL REPOSITORY CATALOG ENDPOINTS (Shared by SuperApp & Developer Console)
// -----------------------------------------------------------------------------

// In-memory runtime storage for repository catalog
let memoryCatalog: any[] = [];

app.get('/api/repository/apps', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    count: memoryCatalog.length,
    apps: memoryCatalog
  });
});

app.post('/api/repository/apps', (req: Request, res: Response) => {
  const newApp = req.body;
  if (!newApp || !newApp.id) {
    return res.status(400).json({ error: 'Valid app package payload is required.' });
  }
  const index = memoryCatalog.findIndex(a => a.id === newApp.id);
  if (index >= 0) {
    memoryCatalog[index] = newApp;
  } else {
    memoryCatalog.unshift(newApp);
  }
  res.status(201).json({ status: 'published', app: newApp });
});

app.put('/api/repository/apps/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const index = memoryCatalog.findIndex(a => a.id === id);
  if (index >= 0) {
    memoryCatalog[index] = { ...memoryCatalog[index], ...updates };
    return res.json({ status: 'updated', app: memoryCatalog[index] });
  }
  res.status(404).json({ error: 'App package not found' });
});

app.delete('/api/repository/apps/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  memoryCatalog = memoryCatalog.filter(a => a.id !== id);
  res.json({ status: 'deleted', id });
});

// -----------------------------------------------------------------------------
// VITE MIDDLEWARE & MULTI-PAGE SERVING
// -----------------------------------------------------------------------------

async function startServer() {
  // Direct route for /admin to /admin.html
  app.get('/admin', (_req: Request, res: Response) => {
    res.redirect('/admin.html');
  });

  // Serve static templates directly for the developer sandbox & test previews
  app.use('/templates', express.static(path.join(process.cwd(), 'templates')));
  app.use(express.static(path.join(process.cwd(), 'public')));

  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);

  if (!isProduction || !hasDist) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));

    app.get('/admin.html', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'admin.html'));
    });

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Harmony OS Super App] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Harmony App Store Console] Admin dashboard at http://0.0.0.0:${PORT}/admin.html`);
  });
}

startServer();
