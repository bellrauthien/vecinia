document.addEventListener('DOMContentLoaded', () => {
    const profileRadios = document.querySelectorAll('input[name="profile"]');
    const addressField = document.getElementById('address-field');
    const registerForm = document.getElementById('register-form');
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    const emailInput = document.getElementById('email');
    const confirmEmailInput = document.getElementById('confirm-email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const emailError = document.getElementById('email-error');
    const birthDateInput = document.getElementById('birth-date');
    const ageError = document.getElementById('age-error');

    const toggleAddressField = () => {
        const isSenior = document.querySelector('input[name="profile"]:checked').value === 'senior';
        addressField.classList.toggle('hidden', !isSenior);
        document.getElementById('address').required = isSenior;
    };

    const validatePhone = () => {
        const phoneRegex = /^[6-9]\d{8}$/;
        const isValid = phoneRegex.test(phoneInput.value);

        if (isValid || phoneInput.value === "") {
            phoneError.style.display = 'none';
            phoneInput.setCustomValidity('');
        } else {
            phoneError.textContent = 'Please enter a valid 9-digit Spanish phone number.';
            phoneError.style.display = 'block';
            phoneInput.setCustomValidity('Please enter a valid 9-digit Spanish phone number.');
        }
        return isValid;
    };

    const validateAge = () => {
        const birthDate = new Date(birthDateInput.value);
        if (!birthDateInput.value) { // if no date is entered
            ageError.textContent = 'Date of birth is required.';
            ageError.style.display = 'block';
            birthDateInput.setCustomValidity('Date of birth is required.');
            return false;
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        const profileType = document.querySelector('input[name=\"profile\"]:checked').value;

        if (profileType === 'volunteer' && age < 18) {
            ageError.textContent = 'Volunteers must be at least 18 years old.';
            ageError.style.display = 'block';
            birthDateInput.setCustomValidity('Volunteers must be at least 18 years old.');
            return false;
        }

        if (profileType === 'senior' && age < 65) {
            ageError.textContent = 'Seniors must be at least 65 years old.';
            ageError.style.display = 'block';
            birthDateInput.setCustomValidity('Seniors must be at least 65 years old.');
            return false;
        }

        ageError.style.display = 'none';
        birthDateInput.setCustomValidity('');
        return true;
    };

    const validateEmail = () => {
        // A simple regex for email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(emailInput.value);

        if (isValid || emailInput.value === "") {
            emailError.style.display = 'none';
            emailInput.setCustomValidity('');
        } else {
            emailError.textContent = 'Please enter a valid email address.';
            emailError.style.display = 'block';
            emailInput.setCustomValidity('Please enter a valid email address.');
        }
        return isValid;
    };

    phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '');
        validatePhone();
    });

    emailInput.addEventListener('input', validateEmail);
    birthDateInput.addEventListener('change', validateAge);

    profileRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            toggleAddressField();
            validateAge(); // Re-validate age when profile type changes
        });
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
            const validateConfirmEmail = () => {
        if (emailInput.value !== confirmEmailInput.value) {
            confirmEmailInput.setCustomValidity('Emails do not match.');
            return false;
        } else {
            confirmEmailInput.setCustomValidity('');
            return true;
        }
    };

    const validateConfirmPassword = () => {
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Passwords do not match.');
            return false;
        } else {
            confirmPasswordInput.setCustomValidity('');
            return true;
        }
    };

    emailInput.addEventListener('change', validateConfirmEmail);
    confirmEmailInput.addEventListener('keyup', validateConfirmEmail);
    passwordInput.addEventListener('change', validateConfirmPassword);
    confirmPasswordInput.addEventListener('keyup', validateConfirmPassword);

    if (validateAge() && validatePhone() && validateEmail() && validateConfirmEmail() && validateConfirmPassword() && registerForm.checkValidity()) {
            const formData = {
                firstName: document.getElementById('first-name').value,
                lastName: document.getElementById('last-name').value,
                email: emailInput.value,
                password: passwordInput.value,
                profileType: document.querySelector('input[name="profile"]:checked').value,
                address: document.getElementById('address').value,
                phone: phoneInput.value,
                birthDate: birthDateInput.value
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    alert('Registration successful! Please log in.');
                    window.location.href = 'login.html';
                } else {
                    const data = await response.json();
                    alert(`Registration failed: ${data.error}`);
                }
            } catch (error) {
                alert('An error occurred. Please try again.');
            }
        }
    });

    // Initial setup
    toggleAddressField();
});

function initAutocomplete() {
    const addressInput = document.getElementById('address');
    const autocomplete = new google.maps.places.Autocomplete(addressInput, {
        types: ['address'],
        componentRestrictions: { 'country': ['ES', 'US', 'GB'] } // Restrict to certain countries
    });
}
