/**
 * AI Voice Chat Application Frontend
 * Handles voice recording, text input, and communication with the backend
 */

class AIVoiceChat {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        
        // API endpoints (update these to match your deployed worker)
        this.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://127.0.0.1:8787' 
            : 'https://your-worker.your-subdomain.workers.dev';
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeVoiceRecording();
        this.loadUserSettings();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.micButton = document.getElementById('micButton');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.statusMessage = document.getElementById('statusMessage');
        this.userNameInput = document.getElementById('userNameInput');
        this.voiceOutputEnabled = document.getElementById('voiceOutputEnabled');
    }

    setupEventListeners() {
        // Text input events
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Voice recording events
        this.micButton.addEventListener('mousedown', () => this.startRecording());
        this.micButton.addEventListener('mouseup', () => this.stopRecording());
        this.micButton.addEventListener('mouseleave', () => this.stopRecording());
        this.micButton.addEventListener('touchstart', () => this.startRecording());
        this.micButton.addEventListener('touchend', () => this.stopRecording());

        // Settings events
        this.userNameInput.addEventListener('change', () => this.saveUserSettings());
        this.voiceOutputEnabled.addEventListener('change', () => this.saveUserSettings());
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    async initializeVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioStream = stream;
            this.showStatus('Microphone ready! Hold the button to record.', 'success');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.showStatus('Microphone access denied. You can still type messages.', 'error');
            this.micButton.disabled = true;
        }
    }

    async startRecording() {
        if (!this.audioStream || this.isRecording) return;

        try {
            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(this.audioStream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            
            this.micButton.classList.add('recording');
            this.recordingIndicator.classList.remove('hidden');
            this.showStatus('Recording... Release to send', 'info');
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showStatus('Error starting recording. Please try again.', 'error');
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.mediaRecorder.stop();
        this.isRecording = false;
        
        this.micButton.classList.remove('recording');
        this.recordingIndicator.classList.add('hidden');
        this.showStatus('Processing audio...', 'info');
    }

    async processRecording() {
        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            const transcription = await this.transcribeAudio(audioBlob);
            
            if (transcription && transcription.trim()) {
                this.addMessage('user', transcription);
                await this.sendChatMessage(transcription);
            } else {
                this.showStatus('Could not understand audio. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error processing recording:', error);
            this.showStatus('Error processing audio. Please try again.', 'error');
        }
    }

    async transcribeAudio(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');

            const response = await fetch(`${this.API_BASE}/api/transcribe`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                return result.text;
            } else {
                throw new Error(result.error || 'Transcription failed');
            }
        } catch (error) {
            console.error('Transcription error:', error);
            throw error;
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.messageInput.value = '';
        this.addMessage('user', message);
        await this.sendChatMessage(message);
    }

    async sendChatMessage(message) {
        try {
            this.sendButton.disabled = true;
            this.showStatus('Thinking...', 'info');

            console.log('Sending message to:', `${this.API_BASE}/api/chat`);
            console.log('Message data:', { message, sessionId: this.sessionId });

            const response = await fetch(`${this.API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    sessionId: this.sessionId,
                    userName: this.userNameInput.value.trim() || null
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Response data:', result);
            
            if (result.success && result.response) {
                // Direct response from simplified backend
                this.addMessage('ai', result.response);
                this.showStatus('', '');
                
                // Optionally synthesize speech
                if (this.voiceOutputEnabled.checked) {
                    await this.synthesizeSpeech(result.response);
                }
            } else {
                throw new Error(result.error || 'Chat request failed');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.showStatus(`Error: ${error.message}`, 'error');
            this.addMessage('ai', 'Oops! I ran into a technical hiccup. Mind trying that again?');
        } finally {
            this.sendButton.disabled = false;
        }
    }

    async pollWorkflowResult(workflowId, maxAttempts = 10) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                // In a real implementation, you'd have an endpoint to check workflow status
                // For now, we'll simulate a response after a delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Mock AI response (replace with actual workflow status check)
                const mockResponses = [
                    "That's really interesting! Tell me more about that.",
                    "I totally get what you mean. It's fascinating how that works!",
                    "Oh wow, I hadn't thought about it that way before. Thanks for sharing!",
                    "That sounds pretty cool! How did you get into that?",
                    "I love hearing about stuff like this. What's been the most surprising part?",
                    "That's awesome! I'm always excited to learn new things from people."
                ];
                
                const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
                this.addMessage('ai', response);
                this.showStatus('', '');
                
                // Optionally synthesize speech
                if (this.voiceOutputEnabled.checked) {
                    await this.synthesizeSpeech(response);
                }
                return;
            } catch (error) {
                console.error('Error polling workflow:', error);
                if (attempt === maxAttempts - 1) {
                    this.addMessage('ai', 'Sorry, I got a bit distracted there. What were we talking about?');
                    this.showStatus('', '');
                }
            }
        }
    }

    async synthesizeSpeech(text) {
        try {
            // Note: This is a placeholder for TTS functionality
            // You can integrate with services like ElevenLabs, OpenAI TTS, or browser's speechSynthesis
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1.1;
                utterance.voice = speechSynthesis.getVoices().find(voice => 
                    voice.name.includes('Google') || voice.name.includes('Microsoft')
                ) || speechSynthesis.getVoices()[0];
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error('Speech synthesis error:', error);
        }
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = content;
        messageContent.appendChild(paragraph);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showStatus(message, type) {
        if (!message) {
            this.statusMessage.classList.add('hidden');
            return;
        }
        
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.classList.remove('hidden');
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                this.statusMessage.classList.add('hidden');
            }, 3000);
        }
    }

    loadUserSettings() {
        const savedName = localStorage.getItem('aiChatUserName');
        const savedVoiceEnabled = localStorage.getItem('aiChatVoiceEnabled');
        
        if (savedName) {
            this.userNameInput.value = savedName;
        }
        
        if (savedVoiceEnabled !== null) {
            this.voiceOutputEnabled.checked = savedVoiceEnabled === 'true';
        }
    }

    saveUserSettings() {
        localStorage.setItem('aiChatUserName', this.userNameInput.value.trim());
        localStorage.setItem('aiChatVoiceEnabled', this.voiceOutputEnabled.checked);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AIVoiceChat();
});