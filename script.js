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


});
