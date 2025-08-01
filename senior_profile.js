document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('senior-profile-form');
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
                document.getElementById('email').value = profile.email || '';
                document.getElementById('phone').value = profile.phone || '';
                document.getElementById('address').value = profile.address || '';
                document.getElementById('about_me').value = profile.about_me || '';
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
                alert('Profile updated successfully!');
            } else {
                alert('Failed to update profile.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('An error occurred while updating the profile.');
        }
    });

    // Load the profile data when the page loads
    loadProfile();
});
