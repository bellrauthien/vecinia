document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
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
                console.log('Received profile data:', profile); // Diagnostic log

                // Refresh user data in localStorage to keep it up-to-date
                localStorage.setItem('user', JSON.stringify(profile));

                document.getElementById('phone').value = profile.phone || '';
                document.getElementById('province').value = profile.province || '';

                // Display last login date and make it read-only
                const lastLoginInput = document.getElementById('last-login');
                if (profile.last_login_date) {
                    const lastLoginDate = new Date(profile.last_login_date);
                    lastLoginInput.value = lastLoginDate.toLocaleString();
                } else {
                    lastLoginInput.value = 'Never';
                }
                lastLoginInput.disabled = true; // Force read-only

                // Set availability
                if (profile.availability) {
                    document.querySelector(`input[name="availability"][value="${profile.availability}"]`).checked = true;
                }

                // Set skills
                const skillCheckboxes = document.querySelectorAll('input[name="skills"]');
                skillCheckboxes.forEach(checkbox => {
                    if (profile.skills && profile.skills.includes(checkbox.value)) {
                        checkbox.checked = true;
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    };

    // Handle form submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectedSkills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(cb => cb.value);
        const selectedAvailability = document.querySelector('input[name="availability"]:checked')?.value;

        const updatedProfile = {
            userId: user.id,
            phone: document.getElementById('phone').value,
            province: document.getElementById('province').value,
            skills: selectedSkills,
            availability: selectedAvailability
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
