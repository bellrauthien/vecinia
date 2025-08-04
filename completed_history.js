document.addEventListener('DOMContentLoaded', () => {
    const completedRemindersList = document.getElementById('completed-reminders-list');
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
                    fetchCompletedReminders();
                } else {
                    alert('No se pudo eliminar el recordatorio. Por favor, inténtalo de nuevo.');
                }
            } catch (error) {
                console.error('Error al eliminar el recordatorio:', error);
                alert('Ocurrió un error al eliminar el recordatorio.');
            }
        }
    };
    
    // Función para crear un elemento de recordatorio
    const createReminderItem = (reminder) => {
        const li = document.createElement('li');
        li.classList.add('reminder-item-simple');
        li.dataset.id = reminder.id; // Store reminder ID

        // Crear un contenedor para el contenido principal del recordatorio
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('reminder-content');
        
        // Determinar el estado y la clase CSS correspondiente
        let statusBadge = '';
        if (reminder.needs_volunteer === 1) {
            statusBadge = `<span class="status-badge completed">Completado</span>`;
        }
        
        // Información del voluntario si está disponible
        let volunteerInfo = '';
        if (reminder.volunteerName) {
            // Crear la información de calificación si está disponible
            let ratingHtml = '';
            if (reminder.volunteerRating > 0) {
                const ratingStars = [];
                const roundedRating = Math.round(reminder.volunteerRating * 2) / 2;
                
                for (let i = 1; i <= 5; i++) {
                    if (i <= roundedRating) {
                        ratingStars.push('<span class="rating-star">★</span>');
                    } else if (i - 0.5 === roundedRating) {
                        ratingStars.push('<span class="rating-star" style="opacity: 0.5;">★</span>');
                    } else {
                        ratingStars.push('<span class="rating-star empty">★</span>');
                    }
                }
                
                ratingHtml = `
                    <div class="rating-container">
                        <div class="rating-stars">${ratingStars.join('')}</div>
                        <span class="rating-count">(${reminder.volunteerRatingCount})</span>
                    </div>
                `;
            }
            
            volunteerInfo = `
                <div class="volunteer-info">
                    <span class="volunteer-label">Voluntario:</span> 
                    <span class="volunteer-name">${reminder.volunteerName}</span>
                    ${reminder.volunteerPhone ? `<span class="volunteer-phone">📞 ${reminder.volunteerPhone}</span>` : ''}
                    ${ratingHtml}
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
        
        return li;
    };

    const fetchCompletedReminders = async () => {
        try {
            console.log('Fetching completed reminders for user:', user.id);
            // Usar el endpoint correcto para obtener los recordatorios completados
            const response = await fetch(`/api/reminders?userId=${user.id}&completed=1`);
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const reminders = await response.json();
                console.log('Completed reminders received:', reminders);
                
                // Limpiar la lista
                completedRemindersList.innerHTML = '';
                
                if (reminders.length === 0) {
                    completedRemindersList.innerHTML = '<li><p>You have no completed appointments.</p></li>';
                    return;
                }
                
                // Ordenar recordatorios por fecha (más recientes primero)
                reminders.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Renderizar todos los recordatorios completados
                reminders.forEach(reminder => {
                    const li = createReminderItem(reminder);
                    completedRemindersList.appendChild(li);
                });
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch completed reminders. Status:', response.status, 'Error:', errorText);
                completedRemindersList.innerHTML = '<li><p>Could not load your completed appointments. Please try again later.</p></li>';
            }
        } catch (error) {
            console.error('Error fetching completed reminders:', error);
            completedRemindersList.innerHTML = '<li><p>An error occurred while loading your completed appointments.</p></li>';
        }
    };

    // Cargar recordatorios completados al cargar la página
    fetchCompletedReminders();
});
