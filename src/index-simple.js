/**
 * Simplified Worker for local testing
 * Basic AI chat without Workflows and Durable Objects
 */

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

    // Simple test endpoint
    if (url.pathname === '/test' && request.method === 'GET') {
      return new Response(JSON.stringify({ 
        message: 'Worker is running!', 
        timestamp: new Date().toISOString() 
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Chat API endpoint - simplified version
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChatSimple(request, env);
    }

    // Voice transcription endpoint
    if (url.pathname === '/api/transcribe' && request.method === 'POST') {
      return handleTranscription(request, env);
    }

    return new Response('Not Found - Available endpoints: /test, /api/chat, /api/transcribe', { 
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};

/**
 * Simplified chat handler without Workflows
 */
async function handleChatSimple(request, env) {
  try {
    const { message, sessionId = 'default' } = await request.json();
    
    if (!message) {
      throw new Error('No message provided');
    }
    
    // Generate AI response using Llama 3.3
    let aiResponse;
    try {
      if (env.AI) {
        console.log('Attempting to use AI model...');
        const response = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          messages: [
            { 
              role: 'system', 
              content: `You are a friendly, casual AI companion. Speak like you're chatting with a close friend. Use casual language, contractions, and natural speech patterns. Be warm, empathetic, and genuinely interested. Keep responses conversational (1-3 sentences). Use humor when appropriate and ask follow-up questions to keep the conversation flowing.` 
            },
            { role: 'user', content: message }
          ],
          max_tokens: 256,
          temperature: 0.7
        });
        
        console.log('AI Response:', response);
        aiResponse = response.response || "Hey! I had a bit of trouble processing that. Can you try again?";
      } else {
        console.log('AI binding not available, using fallback responses');
        // Fallback response when AI binding is not available
        const responses = [
          "That's really interesting! Tell me more about that.",
          "I totally get what you mean. It's fascinating how that works!",
          "Oh wow, I hadn't thought about it that way before. Thanks for sharing!",
          "That sounds pretty cool! How did you get into that?",
          "I love hearing about stuff like this. What's been the most surprising part?",
          "That's awesome! I'm always excited to learn new things from people."
        ];
        aiResponse = responses[Math.floor(Math.random() * responses.length)];
      }
    } catch (aiError) {
      console.error('AI Error:', aiError);
      // More specific fallback responses
      const fallbackResponses = [
        "That's really interesting! Tell me more about that.",
        "I hear you! That's pretty cool stuff.",
        "Nice! I'm always down to chat about whatever's on your mind.",
        "Totally! What's been your experience with that?",
        "That's awesome! How did you first get into that?"
      ];
      aiResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
    
    return new Response(JSON.stringify({
      success: true,
      response: aiResponse,
      sessionId,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
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

    let transcription;
    try {
      if (env.AI) {
        // Use Cloudflare AI to transcribe audio
        const response = await env.AI.run('@cf/openai/whisper', {
          audio: [...new Uint8Array(await audioFile.arrayBuffer())],
        });
        transcription = response.text || '';
      } else {
        transcription = 'Audio transcription not available in local development';
      }
    } catch (aiError) {
      console.error('Transcription error:', aiError);
      transcription = 'Could not transcribe audio';
    }

    return new Response(JSON.stringify({
      success: true,
      text: transcription
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Transcription error:', error);
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