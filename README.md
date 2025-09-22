# 🤖 cf_ai_voice-chat - Cloudflare AI Voice Chat Application

A friendly AI-powered voice chat application built on Cloudflare's edge platform. Chat naturally with an AI companion using voice or text - it's like talking to a tech-savvy friend!

## 🏃‍♂️ Quick Start - Try It Now!

### Option 1: Local Development (Recommended)

**Prerequisites**: Node.js 18+, Python 3.x

```powershell
# 1. Clone and setup
git clone [<your-repo-url>](https://github.com/JeremiahHerring/cf_ai_voice-chat.git)
cd cf_ai_voice-chat
npm install

# 2. Start the backend (Cloudflare Worker)
npm run dev
# ➜ Worker runs on http://127.0.0.1:8787

# 3. In a new terminal, start the frontend
cd frontend
python -m http.server 8000
# ➜ Frontend runs on http://127.0.0.1:8000

# 4. Open http://127.0.0.1:8000 in your browser and start chatting!
```

### Option 2: Deployed Version
**Coming soon** - Deploy to Cloudflare Workers and Pages for production use.

## 🎯 How to Test the Application

1. **Open the frontend** at `http://127.0.0.1:8000`
2. **Type a message** in the chat input and hit Send
3. **Try voice input** by holding the microphone button (🎤) and speaking
4. **Customize settings** by expanding the Settings panel at the bottom

**Sample conversation starters**:
- "Hey! How's it going?"
- "Tell me about something interesting"
- "What's your favorite programming language?"

## ✨ Features Implemented

- **🎤 Voice Input**: Hold microphone button to record speech
- **💬 Text Chat**: Traditional typing interface
- **🧠 AI Responses**: Powered by Llama 3.1 70B on Workers AI
- **📱 Mobile Friendly**: Responsive design
- **🔊 Voice Output**: Browser-based text-to-speech responses
- **⚙️ Settings**: Customizable user preferences

## 🏗️ Architecture

This application demonstrates all required components for the Cloudflare AI assignment:

### 1. **LLM Integration** 
- Uses **Llama 3.3 70B Instruct** on Cloudflare Workers AI
- Configured for casual, friend-like conversation style
- Context-aware responses using conversation history

### 2. **Workflow Coordination**
- **Cloudflare Workflows** orchestrate the conversation flow:
  1. Store user message in Durable Objects
  2. Retrieve conversation context
  3. Generate AI response with Llama 3.3
  4. Store AI response for future context

### 3. **User Input (Voice & Chat)**
- **Voice Input**: Web Audio API + Whisper AI transcription
- **Text Input**: Traditional chat interface
- **Cloudflare Pages** frontend with real-time interaction

### 4. **Memory & State**
- **Durable Objects** store:
  - Conversation history (last 50 messages)
  - User preferences and context
  - Session state and personality settings

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Cloudflare account with Workers AI enabled

### 1. Clone and Setup
```powershell
git clone [<your-repo-url>](https://github.com/JeremiahHerring/cf_ai_voice-chat.git)
cd cloudflare-ai-voice-chat
npm install
```

### 2. Configure Wrangler
```powershell
# Login to Cloudflare
wrangler login

# Update wrangler.toml with your account details
```

### 3. Deploy the Worker
```powershell
# Deploy to Cloudflare Workers
wrangler deploy

# Note the deployed URL for the next step
```

### 4. Deploy the Frontend
```powershell
# Deploy frontend to Cloudflare Pages
cd frontend
npx wrangler pages deploy . --project-name ai-voice-chat

# Update frontend/app.js with your Worker URL
```

### 5. Test Locally
```powershell
# Run worker locally
wrangler dev

# In another terminal, serve frontend locally
cd frontend
python -m http.server 8000
```

## 📁 Project Structure

```
cloudflare-ai-voice-chat/
├── src/
│   ├── index.js                 # Main Worker entry point
│   ├── durable-objects/
│   │   └── ChatMemory.js        # Conversation memory & state
│   └── workflows/
│       └── ChatWorkflow.js      # AI conversation coordination
├── frontend/
│   ├── index.html               # Chat interface
│   ├── styles.css               # UI styling
│   ├── app.js                   # Frontend logic & voice handling
│   └── package.json
├── wrangler.toml                # Cloudflare configuration
├── package.json
└── README.md
```

## 🛠️ API Endpoints

### POST `/api/chat`
Send a chat message to the AI
```json
{
  "message": "Hello! How are you?",
  "sessionId": "session_abc123",
  "userName": "Alex"
}
```

### POST `/api/transcribe`
Transcribe audio to text using Whisper
```javascript
// FormData with 'audio' file
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.wav');
```

### POST `/api/synthesize`  
Convert text to speech (placeholder for TTS integration)
```json
{
  "text": "Hello! Nice to meet you!"
}
```

## 🎯 Key Implementation Details

### AI Personality Configuration
The AI is configured for casual, friendly conversation:
- Uses natural speech patterns and contractions
- Asks follow-up questions to maintain engagement
- Remembers context from previous messages
- Matches conversation energy and tone

### Voice Processing
- **Recording**: Web Audio API with MediaRecorder
- **Transcription**: Cloudflare AI Whisper model
- **Synthesis**: Browser SpeechSynthesis API (upgradeable to external TTS)

### State Management
- **Durable Objects** persist conversation across sessions
- **Workflows** ensure reliable message processing
- **Local Storage** saves user preferences

## 🔧 Configuration

### Environment Variables
Set these in your Cloudflare dashboard:
```
ENVIRONMENT=production
```

### Wrangler Configuration
Update `wrangler.toml`:
- Replace `name` with your preferred worker name
- Update account_id if needed
- Configure custom domains if desired

## 🎨 Customization

### Personality Changes
Edit `ChatWorkflow.js` > `buildSystemPrompt()` to modify AI personality:
```javascript
const systemPrompt = `You are a [describe personality]...`;
```

### UI Themes
Modify `styles.css` gradient colors and styling:
```css
background: linear-gradient(135deg, #your-colors);
```

### Voice Models
Replace Whisper with other models in `index.js`:
```javascript
const response = await env.AI.run('@cf/openai/whisper-large-v3', {
  audio: audioData
});
```

## 🐛 Troubleshooting

### Common Issues
1. **Microphone Access Denied**: Use HTTPS or localhost
2. **Worker Not Found**: Check wrangler.toml configuration
3. **AI Model Errors**: Verify Workers AI is enabled on your account
4. **CORS Issues**: Ensure proper headers in worker responses

### Debug Mode
Enable debug logging:
```javascript
console.log('Debug info:', { message, sessionId, response });
```

## 📈 Scaling Considerations

- **Durable Objects**: Each session creates one instance
- **Workers AI**: Rate limits apply per account
- **Storage**: 50 messages per session (configurable)
- **Bandwidth**: Audio files are processed client-side

---
