document.addEventListener('DOMContentLoaded', () => {
    const remindersList = document.getElementById('reminders-list');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Función para eliminar un recordatorio
    const deleteReminder = async (id) => {
        if (confirm('¿Estás seguro de que deseas eliminar este recordatorio?')) {
            try {
                const response = await fetch(`/api/reminders/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    // Actualizar la lista de recordatorios
                    fetchReminders();
                } else {
                    alert('No se pudo eliminar el recordatorio. Por favor, inténtalo de nuevo.');
                }
            } catch (error) {
                console.error('Error al eliminar el recordatorio:', error);
                alert('Ocurrió un error al eliminar el recordatorio.');
            }
        }
    };

    const renderReminders = (reminders) => {
        remindersList.innerHTML = '';
        if (reminders.length === 0) {
            remindersList.innerHTML = '<li><p>You have no upcoming appointments.</p></li>';
            return;
        }

        reminders.forEach(reminder => {
            const li = document.createElement('li');
            li.classList.add('reminder-item-simple');
            li.dataset.id = reminder.id; // Store reminder ID

            // Crear un contenedor para el contenido principal del recordatorio
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('reminder-content');
            
            // Determinar el estado y la clase CSS correspondiente
            let statusBadge = '';
            if (reminder.needs_volunteer === 1) {
                if (reminder.requestStatus === 'accepted') {
                    statusBadge = `<span class="status-badge accepted">Aceptado</span>`;
                } else {
                    statusBadge = `<span class="status-badge pending">Pendiente</span>`;
                }
            }
            
            // Información del voluntario si está disponible
            let volunteerInfo = '';
            if (reminder.volunteerName) {
                volunteerInfo = `
                    <div class="volunteer-info">
                        <span class="volunteer-label">Voluntario:</span> 
                        <span class="volunteer-name">${reminder.volunteerName}</span>
                        ${reminder.volunteerPhone ? `<span class="volunteer-phone">📞 ${reminder.volunteerPhone}</span>` : ''}
                    </div>
                `;
            }
            
            contentDiv.innerHTML = `
                <div>
                    <div class="reminder-header">
                        <strong class="reminder-type-tag">${reminder.type.replace('-', ' ')}</strong>
                        <span>${reminder.note}</span>
                        ${statusBadge}
                    </div>
                    ${reminder.address ? `<span class="reminder-address-display">📍 ${reminder.address}</span>` : ''}
                    ${volunteerInfo}
                </div>
                <span>${new Date(reminder.date).toLocaleDateString()} at ${reminder.time}</span>
            `;
            
            // Hacer que el contenido sea clickeable para editar
            contentDiv.addEventListener('click', () => {
                window.location.href = `new_reminder.html?id=${reminder.id}`;
            });
            
            // Crear el botón de eliminar
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.innerHTML = '🗑️';
            deleteButton.title = 'Eliminar recordatorio';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que el click se propague al li
                deleteReminder(reminder.id);
            });
            
            // Añadir el contenido y el botón al elemento de la lista
            li.appendChild(contentDiv);
            li.appendChild(deleteButton);

            remindersList.appendChild(li);
        });
    };

    const fetchReminders = async () => {
        try {
            const response = await fetch(`/api/reminders?userId=${user.id}`);
            if (response.ok) {
                const reminders = await response.json();
                renderReminders(reminders);
            } else {
                console.error('Failed to fetch reminders');
                remindersList.innerHTML = '<li><p>Could not load your appointments. Please try again later.</p></li>';
            }
        } catch (error) {
            console.error('Error fetching reminders:', error);
            remindersList.innerHTML = '<li><p>An error occurred while loading your appointments.</p></li>';
        }
    };

    fetchReminders();
});
