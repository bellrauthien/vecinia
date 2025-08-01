document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();

            // Clear user session data
            localStorage.removeItem('user');

            // Redirect to the auth page
            window.location.href = 'auth.html';
        });
    }
});
