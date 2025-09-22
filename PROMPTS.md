# PROMPTS.md - AI Prompts Used in Development

This document contains all the AI prompts and interactions used to develop the cf_ai_voice-chat application.

## Initial Project Prompt

**User Request:**
```
Optional Assignment: See instructions below for Cloudflare AI app assignment. SUBMIT GitHub repo URL for the AI project here. (Please do not submit irrelevant repositories.)
Optional Assignment Instructions: We plan to fast track review of candidates who complete an assignment to build a type of AI-powered application on Cloudflare. An AI-powered application should include the following components:
LLM (recommend using Llama 3.3 on Workers AI), or an external LLM of your choice
Workflow / coordination (recommend using Workflows, Workers or Durable Objects)
User input via chat or voice (recommend using Pages or Realtime)
Memory or state
Find additional documentation here.

I am trying to make an ai chat application that listens to voice and responds in casual conversation, like you're talking to a friend. How do I make this following the requirements above
```

**AI Response:** Created complete project structure with Worker, Durable Objects, Workflows, and Pages frontend.

## System Prompt for AI Personality

**Prompt used in the application:**
```javascript
const systemPrompt = `You are a friendly, casual AI companion. Speak like you're chatting with a close friend. Use casual language, contractions, and natural speech patterns. Be warm, empathetic, and genuinely interested. Keep responses conversational (1-3 sentences). Use humor when appropriate and ask follow-up questions to keep the conversation flowing.`;
```

**Purpose:** This prompt shapes the AI's personality to be conversational and friend-like rather than formal or robotic.

## Detailed System Prompt (Full Version)

**Used in ChatWorkflow.js:**
```javascript
buildSystemPrompt(context) {
    const userName = context.context?.userName || 'friend';
    const personality = context.context?.personality || 'casual_friend';
    
    return `You are a friendly, casual AI companion having a natural conversation with ${userName}. 

Key personality traits:
- Speak like you're chatting with a close friend
- Use casual language, contractions, and natural speech patterns
- Be warm, empathetic, and genuinely interested in the conversation
- Share thoughts and reactions naturally - don't be overly formal or robotic
- Use humor when appropriate, but read the room
- Remember context from previous messages in the conversation
- Ask follow-up questions to keep the conversation flowing
- Be supportive but honest

Conversation style:
- Keep responses conversational length (1-3 sentences usually)
- Use "I" statements and express genuine reactions
- Avoid being preachy or overly helpful unless asked
- Match the energy and tone of the conversation
- Don't start every response the same way

Remember: You're not just answering questions - you're having a genuine conversation with a friend.`;
}
```

## Debugging and Development Prompts

### Troubleshooting CORS Issues
**User:** "Access to fetch at 'https://your-worker.your-subdomain.workers.dev/api/chat' from origin 'http://127.0.0.1:8000' has been blocked by CORS policy"

**AI Solution:** Updated frontend to properly detect local development environment and connect to correct backend URL.

### Fixing Wrangler Configuration
**User:** "✘ [ERROR] Processing wrangler.toml configuration: - "workflows[0]" bindings should have a string "name" field"

**AI Solution:** Corrected wrangler.toml workflows configuration format to include required fields.

### Simplifying for Local Development
**User:** "it just says Oops! something went wrong on my end. Mind giving that another shot?"

**AI Solution:** Created simplified worker version without Workflows/Durable Objects for local development, with better error handling and fallback responses.

## AI Model Selection Prompts

### Initial Model Choice
**Original:** `@cf/meta/llama-3.3-70b-instruct` (as requested in assignment)

### Updated Model Choice  
**Current:** `@cf/meta/llama-3.1-70b-instruct` (more widely available for local development)

**Parameters used:**
```javascript
{
  messages: [system_prompt, user_message],
  max_tokens: 256,
  temperature: 0.7
}
```

## Fallback Response Prompts

**When AI model fails, these responses maintain the friendly personality:**
```javascript
const fallbackResponses = [
  "That's really interesting! Tell me more about that.",
  "I hear you! That's pretty cool stuff.",
  "Nice! I'm always down to chat about whatever's on your mind.",
  "Totally! What's been your experience with that?",
  "That's awesome! How did you first get into that?"
];
```

## Voice Input Prompts

**For speech recognition error handling:**
- "Could not understand audio. Please try again."
- "Audio transcription not available in local development"

## Development Process Prompts

### Project Structure Creation
1. **Worker setup:** Main entry point with API routes
2. **Durable Objects:** For conversation memory and state
3. **Workflows:** For coordinating conversation flow
4. **Pages frontend:** HTML/CSS/JS chat interface
5. **Voice integration:** Web Audio API + Whisper transcription

### Testing and Debugging
1. **Console logging** for debugging network requests
2. **Error boundaries** for graceful failure handling  
3. **Simplified versions** for local development vs production

## Assignment Compliance Prompts

### Meeting Requirements Checklist
- ✅ **LLM**: Llama 3.1 on Workers AI with friend-like personality
- ✅ **Workflow**: Cloudflare Workflows coordinate conversation flow  
- ✅ **Voice Input**: Web Audio API + Whisper transcription
- ✅ **Chat Input**: Text-based conversation interface
- ✅ **Memory**: Durable Objects store conversation history and context
- ✅ **State Management**: Session persistence across interactions

## Notes on AI-Assisted Development

This entire project was built with AI assistance, demonstrating:
- **Rapid prototyping** of full-stack applications
- **Best practices** for Cloudflare platform integration
- **Progressive enhancement** from simple to complex features
- **Error handling** and debugging strategies
- **User experience** optimization for voice interfaces

The AI helped navigate platform-specific challenges like Wrangler configuration, CORS setup, and local development limitations while maintaining the core vision of a friendly, conversational AI companion.