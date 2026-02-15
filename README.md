# Japanese City Pop MIDI Controller 🎹🌆

An AI-powered real-time music controller that generates Japanese City Pop using Google's Gemini Lyria model, controllable via MIDI.

## Features

- 🎵 Real-time AI music generation with Google Gemini
- 🎛️ MIDI controller support for live performance
- 🎨 20 customizable weighted prompts for music style control
- 🎼 Adjustable BPM, chord progressions, and percussion styles
- 📼 Recording capability to save your sessions
- 🌈 Visual audio level feedback

## Tech Stack

- **Frontend**: Vite + TypeScript + Lit (Web Components)
- **AI**: Google Gemini API (Lyria Real-time Music model)
- **Deployment**: Vercel

## Prerequisites

- Node.js >= 18.0.0
- A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
- A MIDI controller (optional, but recommended for the full experience)

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/kimdelsur/jcitypopv2.git
cd jcitypopv2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Gemini API key:

```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Step 1: Secure Your API Key (CRITICAL!)

⚠️ **IMPORTANT**: If you previously deployed with an exposed API key:

1. Go to [Google AI Studio API Keys](https://aistudio.google.com/app/apikey)
2. **Delete your old API key** immediately
3. Create a new API key
4. Set up API restrictions (see below)

### Step 2: Set Up API Key Restrictions

To protect your new API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your API key and click **Edit**
4. Under **Application restrictions**:
   - Select **HTTP referrers (websites)**
   - Add your Vercel domain: `https://yourapp.vercel.app/*`
   - Add localhost for development: `http://localhost:3000/*`
5. Under **API restrictions**:
   - Select **Restrict key**
   - Enable only **Generative Language API**
6. Click **Save**

### Step 3: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel](https://vercel.com) and sign in
2. Click **Add New** > **Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add your environment variable:
   - Click **Environment Variables**
   - Name: `VITE_GEMINI_API_KEY`
   - Value: Your new Gemini API key
   - Environments: Production, Preview, Development
6. Click **Deploy**

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variable when prompted
# or set it in the Vercel dashboard
```

### Step 4: Verify Deployment

1. Visit your deployed URL
2. Open browser DevTools > Console
3. Look for any errors
4. Try playing music with the MIDI controller

## Security Best Practices

### Current Setup (Good for MVP)
- ✅ API key stored in environment variables (not in git)
- ✅ API key restrictions by domain
- ✅ Rate limiting via Google Cloud
- ⚠️ API key still visible in client bundle

### Future Enhancements (For Production)
For a fully secure production app, consider:
1. Implement a backend API proxy using Vercel Edge Functions
2. Move WebSocket connection management to the server
3. Add user authentication
4. Implement server-side API key management

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Your Google Gemini API key | Yes |

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run type-check   # TypeScript type checking
```

## Project Structure

```
jcitypop-midi/
├── components/          # Lit web components
│   ├── PromptDjMidi.ts
│   ├── PlayPauseButton.ts
│   ├── WeightKnob.ts
│   ├── PromptController.ts
│   └── ToastMessage.ts
├── utils/              # Utility functions
│   ├── LiveMusicHelper.ts
│   ├── AudioAnalyser.ts
│   ├── MidiDispatcher.ts
│   ├── audio.ts
│   └── throttle.ts
├── index.tsx           # Main application entry
├── types.ts            # TypeScript type definitions
├── index.html          # HTML template
├── index.css           # Global styles
├── vite.config.ts      # Vite configuration
├── vercel.json         # Vercel deployment config
└── package.json        # Dependencies and scripts
```

## Troubleshooting

### Build Fails on Vercel

**Error**: `VITE_GEMINI_API_KEY environment variable is not set`

**Solution**: Make sure you added the environment variable in Vercel dashboard under **Settings** > **Environment Variables**

### API Key Not Working

**Error**: `Connection error, please restart audio`

**Solution**:
1. Check that your API key is valid
2. Verify API key restrictions allow your domain
3. Ensure Generative Language API is enabled in Google Cloud Console

### No Audio Playing

**Possible causes**:
1. MIDI controller not connected
2. Browser audio permissions not granted
3. At least one prompt must have weight > 0

## License

Apache-2.0

## Credits

Built with [Google Gemini](https://ai.google.dev/) and [Lit](https://lit.dev/)
