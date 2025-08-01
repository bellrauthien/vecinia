document.addEventListener('DOMContentLoaded', () => {
    const newReminderForm = document.getElementById('new-reminder-form');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    newReminderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newReminder = {
            note: document.getElementById('reminder-note').value,
            type: document.getElementById('reminder-type').value,
            date: document.getElementById('reminder-date').value,
            time: document.getElementById('reminder-time').value,
            address: document.getElementById('reminder-address').value,
            province: document.getElementById('province').value,
            userId: user.id,
            needs_volunteer: document.getElementById('needs-volunteer').checked
        };

        try {
            const response = await fetch('/api/reminders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newReminder),
            });

            if (response.ok) {
                alert('Reminder added successfully!');
                window.location.href = 'reminders.html'; // Redirect back to the list
            } else {
                alert('Failed to add reminder. Please try again.');
            }
        } catch (error) {
            console.error('Error saving reminder:', error);
            alert('An error occurred while saving the reminder.');
        }
    });
});
