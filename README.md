# Habeshawi Super App 🚀

An iOS-styled, mobile-first **Super App Ecosystem** that integrates Habeshawi Mini Apps (Notes, Docs, Writing, Music Player, Docs AI, Tri-Calendar, Financial Suite, Ajam Script, and App Store) into a unified mini-app launcher platform powered by Firebase, Gemini AI, and PWA capabilities.

---

## 📱 Integrated Harmony Mini Apps

All Harmony WebApps are accessible via responsive iOS-style mini app frames and synced native cloud tools:

| Mini App Name | GitHub Pages Deployment | Source Repository | Purpose |
| :--- | :--- | :--- | :--- |
| **harmony-notes** | [abduedris313-max.github.io/harmony-notes](https://abduedris313-max.github.io/harmony-notes/) | [github.com/abduedris313-max/harmony-notes](https://github.com/abduedris313-max/harmony-notes) | Quick capture notes with categories, tagging, & cloud backup |
| **harmony-docs** | [abduedris313-max.github.io/harmony-docs](https://abduedris313-max.github.io/harmony-docs/) | [github.com/abduedris313-max/harmony-docs](https://github.com/abduedris313-max/harmony-docs) | Document editor & rich text workspace |
| **harmony-writing** | [abduedris313-max.github.io/harmony-writing](https://abduedris313-max.github.io/harmony-writing/) | [github.com/abduedris313-max/harmony-writing](https://github.com/abduedris313-max/harmony-writing) | Focus-mode writing studio with daily word targets & typewriter sound FX |
| **harmony-music-player** | [abduedris313-max.github.io/harmony-music-player](https://abduedris313-max.github.io/harmony-music-player/) | [github.com/abduedris313-max/harmony-music-player](https://github.com/abduedris313-max/harmony-music-player) | iOS Music Player with playlists, equalizer, synthesizer & background playback |
| **harmony-docs-ai** | [abduedris313-max.github.io/harmony-docs-ai](https://abduedris313-max.github.io/harmony-docs-ai/) | [github.com/abduedris313-max/harmony-docs-ai](https://github.com/abduedris313-max/harmony-docs-ai) | Gemini AI powered document analysis, chat assistant & smart summaries |
| **harmony-voice** | Built-in Mini App | [github.com/abduedris313-max/harmony-super-app](https://github.com/abduedris313-max/harmony-super-app) | Real-time two-way voice conversations with **Gemini 3.8 Live API**, audio transcription with **Gemini 3.5 Transcribe**, and conversational dialogue with **Gemini 3.8 Flash** |
| **harmony-calendar** | [abduedris313-max.github.io/harmony-calendar](https://abduedris313-max.github.io/harmony-calendar/) | [github.com/abduedris313-max/harmony-calendar](https://github.com/abduedris313-max/harmony-calendar) | Tri-calendar platform (Gregorian, Hijri, Ethiopian) with astronomical converter & Google Calendar two-way sync |
| **harmony-finance** | [abduedris313-max.github.io/harmony-finance](https://abduedris313-max.github.io/harmony-finance/) | [github.com/abduedris313-max/harmony-finance](https://github.com/abduedris313-max/harmony-finance) | Financial services suite: Expense & Income tracking, category budgeting, ledger accounts, loan EMI & amortization, and AI Advisor |

---

## ✨ Features & Architecture

- **App Store Developer Console & Admin Portal (`/admin.html` or `/admin`)**:
  - Completely separate codebase and administration dashboard dedicated to publishing, inspecting, version-bumping, and managing mini-apps across the central repository.
  - Multi-view navigation console:
    - **App Catalog Table & Grid View**: Filter by categories (Productivity, Utilities, Developer, Finance, AI, Audio, Health), search by package IDs, sort by downloads, and manage lifecycle statuses (Published, In Review, Draft, Deprecated).
    - **Publish Studio**: Interactive authoring wizard with real-time iOS App Store card preview, Lucide CDN icon selector, color gradient picker, permission toggles, and metadata validation.
    - **Release Pipeline & Version Management**: Semantic version bumping (+Patch, +Minor, +Major), release note changelogs, and SHA-256 integrity checksum verification.
    - **Central Repository Registry Manager**: Connect and ping upstream manifest URLs, test latency, trigger Cloud Firestore database synchronization, and export manifest JSON specifications.
    - **Interactive Test Sandbox**: Simulated iPhone 16 Pro, iPad Air, and Responsive desktop containers with live iframe execution, reload controls, and URL overrides.
    - **Telemetry & Analytics**: Package distribution metrics, top downloaded mini-apps leaderboard, and storage footprint.
- **Central Repository App Store & Package Management**:
  - Browse and query apps from remote central repositories with categorized discovery (Productivity, Utilities, Health, Developer, Audio, AI).
  - Stream downloads with simulated network telemetry, progress bars, and package extraction.
  - Full local storage management with offline bundle precaching and package uninstallation.
  - Downloadable mini-apps include **Weather & Sky**, **Calculator & Scientific Unit Converter**, **Focus Studio (432Hz binaural generator)**, **Dev Terminal (CLI diagnostics)**, and **Habit Momentum (concentric activity rings)**.
- **iOS Lock Screen & Security Suite**:
  - Authentic iOS lock screen experience with customizable clock typography (SF Pro Default, Ultra Bold, SF Rounded, Ge’ez Heritage, Minimal Thin, and Editorial Serif).
  - Passcode PIN protection (4–6 digits) with shake animation, Taptic haptic feedback, and numeric keypad.
  - Live Lock Screen interactive preview right inside Settings.
  - Quick action buttons for Flashlight toggle and Camera, swipe-to-unlock gesture, and media player widget integration.
  - Inactivity auto-lock timer (Never, 1 min, 2 min, 5 min) and keyboard shortcut (`Cmd+L` / `Ctrl+Alt+L`) for instant locking.
  - Granular lock preferences: wallpaper blur, date header, owner greeting subtitle, widget row, notification previews, and Control Center access controls.
- **Springboard Context Menu & App Info Quick Actions**:
  - Long-press any pinned application icon on the Home Screen to open an iOS-style contextual popover with actions: **App Info**, **Share**, and **Remove from Home Screen**.
  - **App Info Modal**:
    - **Quick Actions Section**: Apple iOS HIG grouped card container with fine-grained app preferences directly in the modal.
    - **Notification Settings Toggle**: Instant switch to allow or mute notifications, banner previews, and audio chimes for the selected app, plus a "Test" button to preview alerts.
    - **Local Cache Management**: Real-time byte calculation of cached storage records and offline snapshots, plus a single-tap **Clear Cache** action that purges local data and flushes Service Worker caches with haptic feedback.
    - **Factory Reset Mini App**: Destructive reset action with two-step confirmation that completely wipes all local persistent storage (`localStorage` and `sessionStorage`), cached media (IndexedDB audio blobs, Service Worker CacheStorage entries), and user preferences for the specific mini-app, followed immediately by an iOS Taptic Engine success haptic feedback trigger.
- **iOS 18 Touch Gestures & Haptic Feedback**:
  - Touch gesture support across the system: swipe up on active mini-apps to dismiss to Springboard, swipe down on Home Screen for Spotlight, and horizontal swipe between Springboard and App Library.
  - Multi-tier `navigator.vibrate()` tactile patterns mimicking Taptic Engine feedback (light, medium, heavy, success, selection, and error).
- **Service Worker Offline Firestore Caching**:
  - Two-way caching strategy ensuring notes, documents, drafts, and calendar entries remain accessible and editable even when the device is completely disconnected from the network.
- **Modular Multi-App Architecture**:
  - Each mini-app is merged into a self-contained module inside `/src/apps/` (`notes/`, `docs/`, `writing/`, `music/`, `docs-ai/`) containing dedicated component trees, types, Web Audio synthesizers, and Firestore hooks.
- **iOS 18 Look & Feel & Focus Mode**:
  - Glassmorphic top headers, dynamic island notifications, springboard launcher grid, bottom dock, control center slider drawer, spotlight global search, and 3D app switcher card stack.
  - **Focus Mode**: Quick toggle in Control Center that completely silences non-essential system sounds (typewriter clicks, chimes, UI audio) and suppresses banner notifications into a dedicated silenced tray.
  - Top Status Bar dynamically displays the iOS crescent Moon Focus indicator when active.
- **Firebase Authentication, Firestore Storage & Cross-Device Settings Sync**:
  - Firebase Auth (Anonymous & Email accounts).
  - Firestore Database persistence for Notes, Docs, Writing Drafts, Music Playlists, and Gemini AI Chat histories.
  - **SystemSettings Multi-Device Sync**: User theme preferences (Dark Mode / Light Mode), master volume levels, and Focus Mode state persist and synchronize in real-time across devices via the `/system_settings/{userId}` Firestore collection.
- **Full-Stack Express + Vite Setup**:
  - Express server (`server.ts`) handles API routes (`/api/harmony/ai`, `/api/gemini`, `/api/harmony/apps`, `/api/health`).
  - Bundled for production using `esbuild` into a single CommonJS file at `dist/server.cjs`.
- **PWA Ready**:
  - `manifest.json` web app specification for mobile installation.
  - Service Worker (`sw.js`) handling static asset caching and offline fallback mode.
- **GitHub Actions Integration**:
  - Pre-configured `.github/workflows/deploy.yml` for automated CI/CD deployment.
- **CDN Icons & Assets**:
  - High-performance icon assets loaded via Lucide CDN (`https://cdn.jsdelivr.net/...`).

---

## 💻 Local Development Setup Guide

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher

### 2. Environment Configuration
Copy the `.env.example` file to `.env` in the root directory:

```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
# Server Port
PORT=3000

# Server Node Environment
NODE_ENV=development

# Gemini API Key (Server-side key for AI capabilities)
GEMINI_API_KEY="your_gemini_api_key_here"

# Application Base URL
APP_URL="http://localhost:3000"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Running the Development Server
Run the full-stack development server with live backend reloading via `tsx`:

```bash
npm run dev
```

The application will launch at **`http://localhost:3000`**.

### 5. Available NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **`npm run dev`** | `tsx server.ts` | Runs the full-stack Express + Vite development server on port 3000 |
| **`npm run build`** | `vite build && esbuild server.ts ...` | Builds frontend assets into `/dist` and bundles server to `dist/server.cjs` |
| **`npm run start`** | `node dist/server.cjs` | Starts the production server using compiled CJS bundle |
| **`npm run lint`** | `tsc --noEmit` | Runs TypeScript compiler checks across all frontend & backend files |
| **`npm run clean`** | `rm -rf dist` | Cleans build artifacts |

---

## 🛠️ Step-by-Step Guide: How to Create a New Mini App

Follow this guide to build and integrate a brand new mini app into the **Harmony OS Super App** ecosystem.

### Step 1: Create the Mini App Directory & Module
Create a new directory inside `/src/apps/<your-app-name>/`.

Example: `/src/apps/task-manager/`

#### 1. Define Types (`/src/apps/task-manager/types.ts`):
```typescript
export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}
```

#### 2. Build Sub-Components (`/src/apps/task-manager/components/TaskList.tsx`):
```typescript
import React from 'react';
import { TaskItem } from '../types';

interface TaskListProps {
  tasks: TaskItem[];
  onToggle: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onToggle }) => (
  <div className="space-y-2">
    {tasks.map((task) => (
      <div
        key={task.id}
        onClick={() => onToggle(task.id)}
        className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center justify-between cursor-pointer"
      >
        <span className={task.completed ? 'line-through text-gray-500' : 'text-white'}>
          {task.title}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
          {task.priority}
        </span>
      </div>
    ))}
  </div>
);
```

#### 3. Export Main App Module (`/src/apps/task-manager/index.tsx`):
```typescript
import React, { useState } from 'react';
import { TaskItem } from './types';
import { TaskList } from './components/TaskList';

export const HarmonyTaskManagerAppModule: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'Welcome to Harmony Tasks', completed: false, priority: 'high', createdAt: Date.now() },
  ]);

  const handleToggle = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="flex-1 bg-[#0d1117] text-white p-6 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Harmony Tasks</h2>
      <TaskList tasks={tasks} onToggle={handleToggle} />
    </div>
  );
};

export default HarmonyTaskManagerAppModule;
```

---

### Step 2: Create Container Wrapper Component
Create a wrapper component inside `/src/components/mini-apps/HarmonyTaskManagerApp.tsx`:

```typescript
import React from 'react';
import HarmonyTaskManagerAppModule from '../../apps/task-manager';

export const HarmonyTaskManagerApp: React.FC<any> = () => {
  return <HarmonyTaskManagerAppModule />;
};

export default HarmonyTaskManagerApp;
```

---

### Step 3: Register App Metadata in Config
Open `/src/config/apps.ts` and add your new app configuration to the `HARMONY_APPS` array:

```typescript
import { getLucideCdnIconUrl } from '../lib/cdn';

export const HARMONY_APPS: MiniAppConfig[] = [
  // ... existing apps ...
  {
    id: 'harmony-tasks',
    name: 'Harmony Tasks',
    tagline: 'Task Management & Productivity',
    iconName: 'check-square',
    iconCdnUrl: getLucideCdnIconUrl('check-square'),
    colorGradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    bgHex: '#10b981',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-tasks/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-tasks',
    description: 'Track daily goals, priority tasks, and productivity statistics.',
    badge: 'Tasks'
  }
];
```

---

### Step 4: Add Render Case in AppRunner
Open `/src/components/AppRunner.tsx` and import your new wrapper:

```typescript
import { HarmonyTaskManagerApp } from './mini-apps/HarmonyTaskManagerApp';
```

Then update `renderNativeApp()` inside `AppRunner.tsx`:

```typescript
case 'harmony-tasks':
  return <HarmonyTaskManagerApp user={user} />;
```

---

### Step 5: (Optional) Add Custom Backend Routes
If your mini app needs backend processing or Gemini AI tasks, open `/server.ts` and add an Express route handler:

```typescript
app.post('/api/harmony/tasks', async (req: Request, res: Response) => {
  res.json({ status: 'ok', task: 'Sample task processed' });
});
```

---

### Step 6: Test Your New Mini App
1. Run `npm run dev`
2. Open `http://localhost:3000`
3. Click on your new app icon on the iOS Home Screen or search for it in Spotlight Search!
4. Verify compiling by running `npm run lint` and `npm run build`.

---

## 🛠️ Third-Party Mini App SDK & Templates

Harmony OS provides a complete developer ecosystem for third-party micro-frontends:

### 1. Universal Mini App SDK
- **Universal JS SDK (`/public/harmony-sdk.js`)**: Zero-dependency client for Vanilla JS, Vue, or Svelte mini apps.
- **Typed TypeScript SDK (`/src/lib/harmonySdk.ts`)**: Strongly-typed client for React and modern bundlers.
- **Capabilities**:
  - `Harmony.init()`: Bi-directional host handshake
  - `Harmony.ui.triggerHaptic(type)`: iOS Taptic Engine feedback (`light`, `medium`, `heavy`, `success`)
  - `Harmony.ui.showToast(options)`: Host shell notification banners
  - `Harmony.theme.onChange(cb)`: Synchronizes with system dark/light mode
  - `Harmony.storage`: Scoped, persistent key-value vault
  - `Harmony.navigation.openApp(appId)`: Inter-app deep linking
  - `Harmony.clipboard.writeText()`: Native clipboard bridge

### 2. Official Starter Templates
- **Vanilla Mini App Starter** (`/templates/vanilla-mini-app/`): Zero build step, pure HTML/CSS/JS.
- **React 18 + TypeScript Starter** (`/templates/react-mini-app/`): Modern React with Tailwind CSS and Cupertino styling.
- **AI Utility & Prompt Refiner** (`/templates/ai-tool-mini-app/`): AI transformation card, token metrics, and clipboard triggers.

### 3. Developer Documentation & Console
- Comprehensive documentation available in [`/DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md).
- Interactive **Developer Hub & Templates** tab directly inside the **Developer Console** at `/admin.html`.

---

## 📄 License
MIT License. Crafted for **Harmony OS Super App Platform**.

