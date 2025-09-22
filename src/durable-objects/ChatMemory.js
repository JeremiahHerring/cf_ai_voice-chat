/**
 * Durable Object for managing chat memory and conversation state
 * Stores conversation history and user context for personalized responses
 */

export class ChatMemory {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/messages' && request.method === 'GET') {
      return this.getMessages();
    }
    
    if (url.pathname === '/messages' && request.method === 'POST') {
      return this.addMessage(request);
    }
    
    if (url.pathname === '/context' && request.method === 'GET') {
      return this.getContext();
    }
    
    if (url.pathname === '/context' && request.method === 'PUT') {
      return this.updateContext(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Get conversation history
   */
  async getMessages() {
    const messages = await this.state.storage.get('messages') || [];
    return new Response(JSON.stringify({ messages }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Add a new message to conversation history
   */
  async addMessage(request) {
    const { role, content, timestamp } = await request.json();
    
    const messages = await this.state.storage.get('messages') || [];
    const newMessage = {
      role, // 'user' or 'assistant'
      content,
      timestamp: timestamp || Date.now()
    };
    
    messages.push(newMessage);
    
    // Keep only last 50 messages to manage storage
    if (messages.length > 50) {
      messages.splice(0, messages.length - 50);
    }
    
    await this.state.storage.put('messages', messages);
    
    return new Response(JSON.stringify({ success: true, message: newMessage }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Get user context and preferences
   */
  async getContext() {
    const context = await this.state.storage.get('context') || {
      userName: null,
      preferences: {},
      personality: 'casual_friend',
      topics: []
    };
    
    return new Response(JSON.stringify({ context }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Update user context and preferences
   */
  async updateContext(request) {
    const updates = await request.json();
    const currentContext = await this.state.storage.get('context') || {};
    
    const newContext = {
      ...currentContext,
      ...updates,
      lastUpdated: Date.now()
    };
    
    await this.state.storage.put('context', newContext);
    
    return new Response(JSON.stringify({ success: true, context: newContext }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Get conversation summary for AI context
   */
  async getConversationSummary() {
    const messages = await this.state.storage.get('messages') || [];
    const context = await this.state.storage.get('context') || {};
    
    // Get recent messages for context
    const recentMessages = messages.slice(-10);
    
    return {
      context,
      recentMessages,
      totalMessages: messages.length
    };
  }
}