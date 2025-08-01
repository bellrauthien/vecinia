document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
        };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                // Store user info in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect based on profile type
                if (data.user.profileType === 'volunteer') {
                    window.location.href = 'volunteer_dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                const data = await response.json();
                alert(`Login failed: ${data.error}`);
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    });
});
