class HakiChat {
    constructor() {
        this.messages = [];
        this.dialect = this.getRandomDialect();
        this.sessionId = Math.random().toString(36).substring(7);
        this.isOnline = true;
        this.setupEventListeners();
    }

    getRandomDialect() {
        const dialects = ['Palestinian', 'Syrian', 'Saudi Arabian'];
        return dialects[Math.floor(Math.random() * dialects.length)];
    }

    setupEventListeners() {
        const form = document.querySelector('.message-input form');
        const button = document.querySelector('.button-send');
        
        form.onsubmit = (e) => {
            e.preventDefault();
            this.sendMessage();
        };
        
        button.onclick = (e) => {
            e.preventDefault();
            this.sendMessage();
        };
    }

    async sendMessage() {
        const input = document.querySelector('.message-send');
        const message = input.value.trim();
        if (!message) return;

        this.addMessageToChat(message, 'right');
        input.value = '';

        try {
            const response = await fetch('/api/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    sessionId: this.sessionId,
                    dialect: this.dialect
                })
            });

            const data = await response.json();
            if (data.success) {
                this.addMessageToChat(data.response, 'left');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    addMessageToChat(message, position) {
        const messagesContainer = document.querySelector('.messages-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-box ${position}`;
        messageDiv.innerHTML = `<p>${message}</p>`;
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messagesContainer = document.querySelector('.messages-container');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

const chat = new HakiChat();
