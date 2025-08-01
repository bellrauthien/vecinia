document.addEventListener('DOMContentLoaded', async () => {
    const newReminderForm = document.getElementById('new-reminder-form');
    const user = JSON.parse(localStorage.getItem('user'));
    const params = new URLSearchParams(window.location.search);
    const reminderId = params.get('id');
    const messageContainer = document.getElementById('message-container');

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Si hay un ID, estamos en modo edición
    if (reminderId) {
        document.querySelector('h1').textContent = 'Edit Reminder';
        document.querySelector('.action-button').textContent = 'Update Reminder';

        try {
            const response = await fetch(`/api/reminders/${reminderId}`);
            if (response.ok) {
                const reminder = await response.json();
                // Rellenar el formulario con los datos existentes
                document.getElementById('reminder-note').value = reminder.note;
                document.getElementById('reminder-type').value = reminder.type;
                document.getElementById('reminder-date').value = reminder.date;
                document.getElementById('reminder-time').value = reminder.time;

                document.getElementById('province').value = reminder.province;
                document.getElementById('needs-volunteer').checked = reminder.needs_volunteer;
            } else {
                alert('Could not find the reminder to edit.');
                window.location.href = 'reminders.html';
            }
        } catch (error) {
            console.error('Error fetching reminder:', error);
            alert('An error occurred while fetching the reminder data.');
        }
    }

    newReminderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const reminderData = {
            note: document.getElementById('reminder-note').value,
            type: document.getElementById('reminder-type').value,
            date: document.getElementById('reminder-date').value,
            time: document.getElementById('reminder-time').value,

            province: document.getElementById('province').value,
            needs_volunteer: document.getElementById('needs-volunteer').checked
        };

        // Añadimos el userId solo si estamos creando un nuevo recordatorio
        if (!reminderId) {
            reminderData.userId = user.id;
        }

        const url = reminderId ? `/api/reminders/${reminderId}` : '/api/reminders';
        const method = reminderId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reminderData),
            });

            if (response.ok) {
                displayMessage(`Reminder ${reminderId ? 'updated' : 'added'} successfully!`, 'success', messageContainer);
                setTimeout(() => {
                    window.location.href = 'reminders.html';
                }, 2000);
            } else {
                displayMessage(`Failed to ${reminderId ? 'update' : 'add'} reminder. Please try again.`, 'error', messageContainer);
            }
        } catch (error) {
            console.error('Error saving reminder:', error);
            displayMessage('An error occurred while saving the reminder.', 'error', messageContainer);
        }
    });
});
