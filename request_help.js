document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const callEmergencyContactBtn = document.getElementById('call-emergency-contact');
    const call112Btn = document.getElementById('call-112');

    const loadEmergencyContact = async () => {
        try {
            const response = await fetch(`/api/user/profile/${user.id}`);
            if (response.ok) {
                const profile = await response.json();
                const contactName = profile.emergency_contact_name;
                const contactPhone = profile.emergency_contact_phone;

                if (contactName && contactPhone) {
                    callEmergencyContactBtn.querySelector('span').textContent = `Call ${contactName}`;
                    callEmergencyContactBtn.addEventListener('click', () => {
                        window.location.href = `tel:${contactPhone}`;
                    });
                } else {
                    callEmergencyContactBtn.querySelector('span').textContent = 'No Emergency Contact Set';
                    callEmergencyContactBtn.disabled = true;
                }
            } else {
                console.error('Failed to load emergency contact data');
                callEmergencyContactBtn.querySelector('span').textContent = 'Error Loading Contact';
                callEmergencyContactBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error:', error);
            callEmergencyContactBtn.querySelector('span').textContent = 'Error Loading Contact';
            callEmergencyContactBtn.disabled = true;
        }
    };

    call112Btn.addEventListener('click', () => {
        window.location.href = 'tel:112';
    });

    loadEmergencyContact();
});
