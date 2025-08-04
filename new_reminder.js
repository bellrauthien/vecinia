document.addEventListener('DOMContentLoaded', async () => {
    const newReminderForm = document.getElementById('new-reminder-form');
    const user = JSON.parse(localStorage.getItem('user'));
    const params = new URLSearchParams(window.location.search);
    const reminderId = params.get('id');
    const messageContainer = document.getElementById('message-container');
    const deleteButton = document.getElementById('delete-button');

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Si hay un ID, estamos en modo edición
    if (reminderId) {
        document.querySelector('h1').textContent = 'Edit Reminder';
        document.querySelector('.action-button').textContent = 'Update Reminder';
        
        // Mostrar el botón de eliminar
        deleteButton.style.display = 'block';
        
        // Configurar el evento para eliminar el recordatorio
        deleteButton.addEventListener('click', async () => {
            if (confirm('¿Estás seguro de que deseas eliminar este recordatorio?')) {
                try {
                    const response = await fetch(`/api/reminders/${reminderId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        displayMessage('Recordatorio eliminado correctamente', 'success', messageContainer);
                        setTimeout(() => {
                            window.location.href = 'reminders.html';
                        }, 2000);
                    } else {
                        displayMessage('No se pudo eliminar el recordatorio. Por favor, inténtalo de nuevo.', 'error', messageContainer);
                    }
                } catch (error) {
                    console.error('Error al eliminar el recordatorio:', error);
                    displayMessage('Ocurrió un error al eliminar el recordatorio.', 'error', messageContainer);
                }
            }
        });

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
                
                // Mostrar información del voluntario y estado de la solicitud si es necesario
                if (reminder.needs_volunteer) {
                    const volunteerInfoSection = document.getElementById('volunteer-info-section');
                    const requestStatus = document.getElementById('request-status');
                    const volunteerName = document.getElementById('volunteer-name');
                    const volunteerPhone = document.getElementById('volunteer-phone');
                    
                    volunteerInfoSection.style.display = 'block';
                    
                    // Mostrar el estado de la solicitud
                    if (reminder.volunteerId) {
                        requestStatus.textContent = 'Aceptado';
                        requestStatus.className = 'status-badge accepted';
                        
                        // Mostrar información del voluntario
                        if (reminder.seniorFirstName && reminder.seniorLastName) {
                            // Si estamos viendo desde la API de recordatorios individuales
                            volunteerName.textContent = `Nombre: ${reminder.volunteerFirstName || ''} ${reminder.volunteerLastName || ''}`;
                            volunteerPhone.textContent = reminder.volunteerPhone ? `Teléfono: ${reminder.volunteerPhone}` : '';
                        } else {
                            // Necesitamos obtener la información del voluntario
                            try {
                                const volunteerResponse = await fetch(`/api/user/profile/${reminder.volunteerId}`);
                                if (volunteerResponse.ok) {
                                    const volunteer = await volunteerResponse.json();
                                    volunteerName.textContent = `Nombre: ${volunteer.firstName} ${volunteer.lastName}`;
                                    volunteerPhone.textContent = volunteer.phone ? `Teléfono: ${volunteer.phone}` : '';
                                }
                            } catch (error) {
                                console.error('Error fetching volunteer info:', error);
                            }
                        }
                    } else {
                        requestStatus.textContent = 'Pendiente';
                        requestStatus.className = 'status-badge pending';
                        document.getElementById('volunteer-details').style.display = 'none';
                    }
                }
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
