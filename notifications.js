function displayMessage(message, type, container) {
    if (!container) {
        console.error('Message container not found for message:', message);
        return;
    }

    container.textContent = message;
    container.className = `message-container ${type} show`;

    // Hide the message after 4 seconds
    setTimeout(() => {
        container.className = 'message-container';
    }, 4000);
}
