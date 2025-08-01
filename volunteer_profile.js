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
                document.getElementById('phone').value = profile.phone || '';
                document.getElementById('province').value = profile.province || '';

                // Display last login date
                if (profile.last_login_date) {
                    const lastLoginDate = new Date(profile.last_login_date);
                    document.getElementById('last-login').value = lastLoginDate.toLocaleString();
                } else {
                    document.getElementById('last-login').value = 'Never';
                }

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
        messageContainer.textContent = ''; // Clear previous messages

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
