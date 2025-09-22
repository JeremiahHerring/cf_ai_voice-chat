/**
 * Workflow for coordinating chat interactions
 * Handles the full conversation flow from input to AI response
 */

export class ChatWorkflow {
  async run(event, step) {
    const { message, sessionId, chatMemoryId } = event.params;
    
    // Step 1: Store user message in memory
    const userMessageStored = await step.do('store-user-message', async () => {
      const response = await fetch(`https://chat-memory.${chatMemoryId}.workers.dev/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: message,
          timestamp: Date.now()
        })
      });
      return response.json();
    });

    // Step 2: Get conversation context
    const conversationContext = await step.do('get-context', async () => {
      const [messagesRes, contextRes] = await Promise.all([
        fetch(`https://chat-memory.${chatMemoryId}.workers.dev/messages`),
        fetch(`https://chat-memory.${chatMemoryId}.workers.dev/context`)
      ]);
      
      const messages = await messagesRes.json();
      const context = await contextRes.json();
      
      return { messages: messages.messages, context: context.context };
    });

    // Step 3: Generate AI response using Llama 3.3
    const aiResponse = await step.do('generate-ai-response', async () => {
      return this.generateAIResponse(
        message,
        conversationContext,
        event.env
      );
    });

    // Step 4: Store AI response in memory
    const aiMessageStored = await step.do('store-ai-message', async () => {
      const response = await fetch(`https://chat-memory.${chatMemoryId}.workers.dev/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: aiResponse,
          timestamp: Date.now()
        })
      });
      return response.json();
    });

    return {
      success: true,
      response: aiResponse,
      sessionId
    };
  }

  /**
   * Generate AI response using Llama 3.3 on Workers AI
   */
  async generateAIResponse(userMessage, context, env) {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const conversationHistory = this.buildConversationHistory(context.messages);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
        messages,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.9
      });

      return response.response || 'Hey! I had a bit of trouble processing that. Can you try again?';
    } catch (error) {
      console.error('AI generation error:', error);
      return 'Oops! Something went wrong on my end. Mind giving that another shot?';
    }
  }

  /**
   * Build system prompt for casual, friend-like conversation
   */
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

  /**
   * Build conversation history for AI context
   */
  buildConversationHistory(messages) {
    if (!messages || messages.length === 0) return [];
    
    // Get last 10 messages for context, excluding system messages
    return messages
      .slice(-10)
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }
}