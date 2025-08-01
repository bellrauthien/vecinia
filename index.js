document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userNameSpan = document.getElementById('user-name');

    if (user && user.firstName) {
        userNameSpan.textContent = user.firstName;
    } else {
        // Fallback if no user is found, though the user should be logged in to see this page.
        userNameSpan.textContent = 'Guest';
    }
});
