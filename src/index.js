/**
 * Main Worker entry point
 * Handles API routes and coordinates between components
 */

import { ChatMemory } from './durable-objects/ChatMemory.js';
import { ChatWorkflow } from './workflows/ChatWorkflow.js';

export { ChatMemory, ChatWorkflow };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Chat API endpoint
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    // Voice transcription endpoint
    if (url.pathname === '/api/transcribe' && request.method === 'POST') {
      return handleTranscription(request, env);
    }

    // Voice synthesis endpoint
    if (url.pathname === '/api/synthesize' && request.method === 'POST') {
      return handleSynthesis(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Handle chat messages and coordinate AI responses
 */
async function handleChat(request, env) {
  try {
    const { message, sessionId = 'default' } = await request.json();
    
    // Get Durable Object instance for this session
    const id = env.CHAT_MEMORY.idFromName(sessionId);
    const chatMemory = env.CHAT_MEMORY.get(id);
    
    // Start the chat workflow
    const workflowId = `chat-${sessionId}-${Date.now()}`;
    const workflow = await env.CHAT_WORKFLOW.create({
      id: workflowId,
      params: {
        message,
        sessionId,
        chatMemoryId: id.toString()
      }
    });

    const result = await workflow.status();
    
    return new Response(JSON.stringify({
      success: true,
      workflowId,
      status: result.status
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * Handle voice transcription using Whisper AI
 */
async function handleTranscription(request, env) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    // Use Cloudflare AI to transcribe audio
    const response = await env.AI.run('@cf/openai/whisper', {
      audio: [...new Uint8Array(await audioFile.arrayBuffer())],
    });

    return new Response(JSON.stringify({
      success: true,
      text: response.text
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * Handle text-to-speech synthesis
 */
async function handleSynthesis(request, env) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      throw new Error('No text provided');
    }

    // For now, return success - TTS can be implemented with external service
    // or when Cloudflare adds TTS models
    return new Response(JSON.stringify({
      success: true,
      message: 'TTS endpoint ready - implement with preferred TTS service'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}