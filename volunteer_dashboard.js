document.addEventListener('DOMContentLoaded', () => {
    const welcomeTitle = document.getElementById('welcome-title');
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.firstName) {
        welcomeTitle.textContent = `Welcome, ${user.firstName}`;
    } else {
        // Fallback in case user data is not available
        welcomeTitle.textContent = 'Welcome';
    }
});
