// Función para verificar si el usuario puede calificar y mostrar el formulario de calificación
async function checkAndShowRatingForm(reminder, userId, container) {
    try {
        const canRateResponse = await canUserRateReminder(reminder.id, userId);
        
        if (canRateResponse.canRate) {
            container.style.display = 'block';
            
            // Determinar a quién está calificando el usuario
            const ratedId = canRateResponse.ratedId;
            const userRole = canRateResponse.userRole;
            
            // Crear y mostrar el formulario de calificación
            const ratingForm = createRatingForm(
                reminder.id,
                userId,
                ratedId,
                userRole,
                () => {
                    // Recargar la página después de enviar la calificación
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            );
            
            container.appendChild(ratingForm);
        }
    } catch (error) {
        console.error('Error checking rating eligibility:', error);
    }
}

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

                // If the reminder is completed, disable all form fields
                if (reminder.completed === 1) {
                    document.querySelector('h1').textContent = 'Completed Appointment';
                    const formElements = newReminderForm.elements;
                    for (let i = 0; i < formElements.length; i++) {
                        formElements[i].disabled = true;
                    }
                    // Hide the submit and delete buttons
                    document.querySelector('.action-button').style.display = 'none';
                    deleteButton.style.display = 'none';
                }

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
                    const volunteerRatingContainer = document.getElementById('volunteer-rating-container');
                    const completeSection = document.getElementById('complete-section');
                    const ratingSection = document.getElementById('rating-section');
                    
                    volunteerInfoSection.style.display = 'block';
                    
                    // Mostrar el estado de la solicitud
                    if (reminder.volunteerId) {
                        // Verificar si el recordatorio está completado
                        if (reminder.completed === 1) {
                            requestStatus.textContent = 'Completado';
                            requestStatus.className = 'status-badge completed';
                        } else {
                            requestStatus.textContent = 'Aceptado';
                            requestStatus.className = 'status-badge accepted';
                            
                            // Si el usuario es el senior o el voluntario, mostrar botón para marcar como completado
                            if (user.id == reminder.userId || user.id == reminder.volunteerId) {
                                completeSection.style.display = 'block';
                                completeSection.appendChild(createCompleteButton(reminder.id, () => {
                                    // Recargar la página para mostrar la opción de calificar
                                    window.location.reload();
                                }));
                            }
                        }
                        
                        // Mostrar información del voluntario
                        volunteerName.textContent = `Nombre: ${reminder.volunteerFirstName || ''} ${reminder.volunteerLastName || ''}`;
                        volunteerPhone.textContent = reminder.volunteerPhone ? `Teléfono: ${reminder.volunteerPhone}` : '';
                        
                        // Mostrar calificación del voluntario si tiene
                        if (reminder.volunteerRating > 0) {
                            const ratingDiv = document.createElement('div');
                            ratingDiv.className = 'user-rating-badge';
                            ratingDiv.appendChild(createRatingStars(reminder.volunteerRating, reminder.volunteerRatingCount));
                            volunteerRatingContainer.appendChild(ratingDiv);
                        }
                        
                        // Si el recordatorio está completado, verificar si el usuario puede calificar
                        if (reminder.completed) {
                            // Verificar si el usuario ya ha calificado este recordatorio
                            fetch(`/api/reminders/${reminder.id}/can-rate?userId=${user.id}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (!data.canRate && data.hasRated) {
                                        // El usuario ya ha calificado, deshabilitar los botones
                                        const updateButton = document.querySelector('.action-button');
                                        const deleteButton = document.getElementById('delete-button');
                                        
                                        if (updateButton) {
                                            updateButton.disabled = true;
                                            updateButton.style.opacity = '0.5';
                                            updateButton.style.cursor = 'not-allowed';
                                        }
                                        
                                        if (deleteButton) {
                                            deleteButton.disabled = true;
                                            deleteButton.style.display = 'none';
                                        }
                                    } else {
                                        // El usuario puede calificar, mostrar el formulario
                                        checkAndShowRatingForm(reminder, user.id, ratingSection);
                                    }
                                })
                                .catch(error => {
                                    console.error('Error verificando si puede calificar:', error);
                                    // En caso de error, intentar mostrar el formulario de calificación
                                    checkAndShowRatingForm(reminder, user.id, ratingSection);
                                });
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

        try {
            let response;
            if (reminderId) {
                // Update existing reminder
                response = await fetch(`/api/reminders/${reminderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reminderData)
                });
            } else {
                // Create new reminder
                reminderData.userId = user.id;
                response = await fetch('/api/reminders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reminderData)
                });
            }

            if (response.ok) {
                displayMessage(`Reminder ${reminderId ? 'updated' : 'created'} successfully!`, 'success', messageContainer);
                setTimeout(() => {
                    window.location.href = 'reminders.html';
                }, 2000);
            } else {
                displayMessage('Failed to save the reminder.', 'error', messageContainer);
            }
        } catch (error) {
            console.error('Error saving reminder:', error);
            displayMessage('An error occurred while saving the reminder.', 'error', messageContainer);
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
