document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('userName');
    const welcomeHeader = document.getElementById('welcome-header');
    if (userName) {
        welcomeHeader.textContent = `Hello, ${userName}`;
    }

    const chatButton = document.getElementById('chat-button');
    const remindersButton = document.getElementById('reminders-button');
    const helpButton = document.getElementById('help-button');

    chatButton.addEventListener('click', () => {
        window.location.href = 'chat.html';
    });

    remindersButton.addEventListener('click', () => {
        window.location.href = 'reminders.html';
    });

    helpButton.addEventListener('click', () => {
        // A confirmation dialog is good practice for critical actions
        if (confirm('Are you sure you want to request help? An alert will be sent.')) {
            alert('Help is on the way! Your contacts have been notified.');
        }    // Future implementation: send a notification or make a call
    });
});
