document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
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

                // Set availability
                if (profile.availability) {
                    document.querySelector(`input[name="availability"][value="${profile.availability}"]`).checked = true;
                }

                // Set skills
                const skillCheckboxes = document.querySelectorAll('input[name="skills"]');
                skillCheckboxes.forEach(checkbox => {
                    if (profile.skills.includes(checkbox.value)) {
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
