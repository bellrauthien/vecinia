document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatWindow = document.getElementById('chat-window');

    const addMessage = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
    };

    const getAIResponse = async (userMessage) => {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            addMessage(data.reply, 'ai');
        } catch (error) {
            console.error('Error fetching AI response:', error);
            addMessage('Sorry, I cannot connect to the assistant at this time.', 'ai');
        }
    };

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        if (userMessage) {
            addMessage(userMessage, 'user');
            messageInput.value = '';
            getAIResponse(userMessage);
        }
    });

    // Add a welcome message
    addMessage('Hello! How can I help you today?', 'ai');
});
