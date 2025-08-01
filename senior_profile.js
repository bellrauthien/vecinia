document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('senior-profile-form');
    const messageContainer = document.getElementById('message-container');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Function to load profile data into the form
    const loadProfile = async () => {
        try {
            const response = await fetch(`/api/user/profile/${user.id}`);
            if (response.ok) {
                const profile = await response.json();

                // Refresh user data in localStorage to keep it up-to-date
                localStorage.setItem('user', JSON.stringify(profile));

                document.getElementById('email').value = profile.email || '';
                document.getElementById('phone').value = profile.phone || '';
                document.getElementById('province').value = profile.province || '';
                document.getElementById('about_me').value = profile.about_me || '';

                // Display last login date and make it read-only
                const lastLoginInput = document.getElementById('last-login');
                if (profile.last_login_date) {
                    const lastLoginDate = new Date(profile.last_login_date);
                    lastLoginInput.value = lastLoginDate.toLocaleString();
                } else {
                    lastLoginInput.value = 'Never';
                }
                lastLoginInput.disabled = true; // Force read-only
            } else {
                console.error('Failed to load profile data');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    // Handle form submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedProfile = {
            userId: user.id,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            province: document.getElementById('province').value,
            about_me: document.getElementById('about_me').value
        };

        try {
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedProfile)
            });

            if (response.ok) {
                displayMessage('Profile updated successfully!', 'success', messageContainer);
            } else {
                displayMessage('Failed to update profile.', 'error', messageContainer);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            displayMessage('An error occurred while updating the profile.', 'error', messageContainer);
        }
    });

    // Load the profile data when the page loads
    loadProfile();
});
