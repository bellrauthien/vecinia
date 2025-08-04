document.addEventListener('DOMContentLoaded', () => {
    const pendingRemindersList = document.getElementById('pending-reminders-list');
    const acceptedRemindersList = document.getElementById('accepted-reminders-list');
    const completedRemindersList = document.getElementById('completed-reminders-list');
    const showMoreButton = document.getElementById('show-more-completed');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Estado para controlar la visibilidad de los recordatorios completados
    let showAllCompleted = false;
    const MAX_VISIBLE_COMPLETED = 3; // Número máximo de recordatorios completados visibles inicialmente
    
    // Configurar el evento para el botón "Show More"
    showMoreButton.addEventListener('click', () => {
        showAllCompleted = !showAllCompleted;
        fetchReminders(); // Volver a renderizar los recordatorios con el nuevo estado
    });

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
            if (reminder.completed === 1) {
                statusBadge = `<span class="status-badge completed">Completado</span>`;
            } else if (reminder.requestStatus === 'accepted') {
                statusBadge = `<span class="status-badge accepted">Aceptado</span>`;
            } else {
                statusBadge = `<span class="status-badge pending">Pendiente</span>`;
            }
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

    const renderReminders = (reminders) => {
        // Limpiar todas las listas
        pendingRemindersList.innerHTML = '';
        acceptedRemindersList.innerHTML = '';
        completedRemindersList.innerHTML = '';
        
        // Clasificar los recordatorios por estado
        const pendingReminders = [];
        const acceptedReminders = [];
        const completedReminders = [];
        
        reminders.forEach(reminder => {
            if (reminder.needs_volunteer === 1) {
                if (reminder.completed === 1) {
                    completedReminders.push(reminder);
                } else if (reminder.requestStatus === 'accepted') {
                    acceptedReminders.push(reminder);
                } else {
                    pendingReminders.push(reminder);
                }
            } else {
                // Si no necesita voluntario, se considera un recordatorio personal
                pendingReminders.push(reminder);
            }
        });
        
        // Mostrar mensaje si no hay recordatorios en ninguna categoría
        if (pendingReminders.length === 0 && acceptedReminders.length === 0 && completedReminders.length === 0) {
            pendingRemindersList.innerHTML = '<li><p>You have no appointments.</p></li>';
            return;
        }
        
        // Mostrar mensaje si no hay recordatorios pendientes
        if (pendingReminders.length === 0) {
            pendingRemindersList.innerHTML = '<li><p>No pending appointments.</p></li>';
        } else {
            // Renderizar recordatorios pendientes
            pendingReminders.forEach(reminder => {
                const li = createReminderItem(reminder);
                pendingRemindersList.appendChild(li);
            });
        }
        
        // Mostrar mensaje si no hay recordatorios aceptados
        if (acceptedReminders.length === 0) {
            acceptedRemindersList.innerHTML = '<li><p>No accepted appointments.</p></li>';
        } else {
            // Renderizar recordatorios aceptados
            acceptedReminders.forEach(reminder => {
                const li = createReminderItem(reminder);
                acceptedRemindersList.appendChild(li);
            });
        }
        
        // Mostrar mensaje si no hay recordatorios completados
        if (completedReminders.length === 0) {
            completedRemindersList.innerHTML = '<li><p>No completed appointments.</p></li>';
            showMoreButton.style.display = 'none';
        } else {
            // Ordenar recordatorios completados por fecha (más recientes primero)
            completedReminders.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Determinar cuántos recordatorios completados mostrar
            const visibleCount = showAllCompleted ? completedReminders.length : Math.min(MAX_VISIBLE_COMPLETED, completedReminders.length);
            
            // Renderizar recordatorios completados visibles
            for (let i = 0; i < visibleCount; i++) {
                const li = createReminderItem(completedReminders[i]);
                completedRemindersList.appendChild(li);
            }
            
            // Mostrar u ocultar el botón "Show More" según sea necesario
            if (completedReminders.length > MAX_VISIBLE_COMPLETED) {
                showMoreButton.style.display = 'block';
                showMoreButton.textContent = showAllCompleted ? 'Show Less' : `Show More (${completedReminders.length - MAX_VISIBLE_COMPLETED} more)`;
            } else {
                showMoreButton.style.display = 'none';
            }
        }
    };

    const fetchReminders = async () => {
        try {
            console.log('Fetching reminders for user:', user.id);
            const response = await fetch(`/api/reminders?userId=${user.id}`);
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const reminders = await response.json();
                console.log('Reminders received:', reminders);
                renderReminders(reminders);
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch reminders. Status:', response.status, 'Error:', errorText);
                pendingRemindersList.innerHTML = '<li><p>Could not load your appointments. Please try again later.</p></li>';
            }
        } catch (error) {
            console.error('Error fetching reminders:', error);
            pendingRemindersList.innerHTML = '<li><p>An error occurred while loading your appointments.</p></li>';
        }
    };

    // Cargar recordatorios al cargar la página
    fetchReminders();
});
