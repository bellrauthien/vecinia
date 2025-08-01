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
                document.getElementById('address').value = profile.address || '';
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
        messageContainer.textContent = ''; // Clear previous messages

        const updatedProfile = {
            userId: user.id,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
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
                messageContainer.textContent = 'Profile updated successfully!';
                messageContainer.className = 'message-container success';
            } else {
                messageContainer.textContent = 'Failed to update profile.';
                messageContainer.className = 'message-container error';
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            messageContainer.textContent = 'An error occurred while updating the profile.';
            messageContainer.className = 'message-container error';
        } finally {
            setTimeout(() => {
                messageContainer.textContent = '';
                messageContainer.className = 'message-container';
            }, 3000);
        }
    });

    // Load the profile data when the page loads
    loadProfile();
});
