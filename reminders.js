document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOM Content Loaded - Inicializando...');
    
    // Verificar que los elementos DOM existen antes de asignarlos
    const pendingRemindersList = document.getElementById('pending-reminders-list');
    if (!pendingRemindersList) {
        console.error('[DEBUG] Error: No se encontró el elemento #pending-reminders-list');
        return; // Detener la ejecución si no se encuentra el elemento
    }
    
    const acceptedRemindersList = document.getElementById('accepted-reminders-list');
    if (!acceptedRemindersList) {
        console.error('[DEBUG] Error: No se encontró el elemento #accepted-reminders-list');
        return;
    }
    
    const completedRemindersList = document.getElementById('completed-reminders-list');
    if (!completedRemindersList) {
        console.error('[DEBUG] Error: No se encontró el elemento #completed-reminders-list');
        return;
    }
    
    const showMoreButton = document.getElementById('show-more-completed');
    if (!showMoreButton) {
        console.error('[DEBUG] Error: No se encontró el elemento #show-more-completed');
        // No detenemos la ejecución por este elemento ya que no es crítico
    } else {
        // Configurar el evento para el botón "Show More"
        showMoreButton.addEventListener('click', () => {
            console.log('[DEBUG] Show More button clicked - Estado actual:', showAllCompleted);
            showAllCompleted = !showAllCompleted;
            fetchReminders(); // Volver a renderizar los recordatorios con el nuevo estado
        });
    }
    
    // Verificar que el usuario está en localStorage
    let user;
    try {
        const userString = localStorage.getItem('user');
        console.log('[DEBUG] User string from localStorage:', userString);
        if (!userString) {
            console.error('[DEBUG] Error: No se encontró el usuario en localStorage');
            window.location.href = 'login.html';
            return;
        }
        user = JSON.parse(userString);
    } catch (error) {
        console.error('[DEBUG] Error al parsear el usuario desde localStorage:', error);
        window.location.href = 'login.html';
        return;
    }
    
    // Estado para controlar la visibilidad de los recordatorios completados
    let showAllCompleted = false;
    const MAX_VISIBLE_COMPLETED = 3; // Número máximo de recordatorios completados visibles inicialmente

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

        // Make the reminder clickable only if it's not completed
        if (reminder.completed !== 1) {
            li.classList.add('editable');
            li.addEventListener('click', () => {
                window.location.href = `new_reminder.html?id=${reminder.id}`;
            });
        }

        // Crear un contenedor para el contenido principal del recordatorio
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('reminder-content');
        
        // Determinar el estado y la clase CSS correspondiente
        let statusBadge = '';
        if (reminder.needs_volunteer === 1) {
            if (reminder.completed === 1) {
                statusBadge = `<span class="status-badge completed">Completed</span>`;
            } else if (reminder.requestStatus === 'accepted') {
                statusBadge = `<span class="status-badge accepted">Accepted</span>`;
            } else {
                statusBadge = `<span class="status-badge pending">Pending</span>`;
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
                    <span class="volunteer-label">Volunteer:</span> 
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
                ${reminder.address ? `<span class="reminder-address-display"><i class="fas fa-map-marker-alt"></i> ${reminder.address}</span>` : ''}
                ${volunteerInfo}
            </div>
            <span><i class="far fa-calendar-alt"></i> ${new Date(reminder.date).toLocaleDateString()} at ${reminder.time}</span>
        `;
        

        
        // Add delete button only if the reminder is not completed
        if (reminder.completed !== 1) {
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.innerHTML = '🗑️';
            deleteButton.title = 'Delete appointment';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent click from propagating to li
                deleteReminder(reminder.id);
            });
            li.appendChild(deleteButton);
        }

        // Añadir el contenido al elemento de la lista
        li.appendChild(contentDiv);
        
        // Añadir botón de completar tarea si es un recordatorio aceptado
        if (reminder.needs_volunteer === 1 && reminder.requestStatus === 'accepted' && reminder.completed !== 1) {
            const completeButtonContainer = document.createElement('div');
            completeButtonContainer.classList.add('complete-button-container', 'mt-2');
            
            // Usar la función createCompleteButton de ratings.js
            if (typeof createCompleteButton === 'function') {
                const completeButton = createCompleteButton(reminder.id, () => {
                    // Callback cuando se completa exitosamente
                    fetchReminders(); // Recargar los recordatorios
                });
                
                // Actualizar las clases para el nuevo diseño
                completeButton.className = 'btn btn-success btn-sm';
                completeButton.innerHTML = '<i class="fas fa-check"></i> Mark as completed';
                
                completeButtonContainer.appendChild(completeButton);
                li.appendChild(completeButtonContainer);
            } else {
                console.error('La función createCompleteButton no está disponible');
            }
        }
        
        return li;
    };

    const renderReminders = (reminders) => {
        console.log('[DEBUG] renderReminders - Iniciando renderizado...');
        
        // Verificar que los elementos DOM existen
        if (!pendingRemindersList) {
            console.error('[DEBUG] renderReminders - Error: pendingRemindersList no existe');
            return;
        }
        if (!acceptedRemindersList) {
            console.error('[DEBUG] renderReminders - Error: acceptedRemindersList no existe');
            return;
        }
        if (!completedRemindersList) {
            console.error('[DEBUG] renderReminders - Error: completedRemindersList no existe');
            return;
        }
        
        // Verificar que reminders es un array
        if (!Array.isArray(reminders)) {
            console.error('[DEBUG] renderReminders - Error: reminders no es un array', typeof reminders);
            pendingRemindersList.innerHTML = '<li><p>Error: Invalid data format.</p></li>';
            return;
        }
        
        // Limpiar todas las listas
        pendingRemindersList.innerHTML = '';
        acceptedRemindersList.innerHTML = '';
        completedRemindersList.innerHTML = '';
        
        console.log('[DEBUG] renderReminders - Total reminders received:', reminders.length);
        
        // Analizar los tipos de datos de los campos críticos en el primer recordatorio (si existe)
        if (reminders.length > 0) {
            const sample = reminders[0];
            console.log('[DEBUG] TIPOS DE DATOS DE CAMPOS CRÍTICOS:');
            console.log('[DEBUG] completed -', 'Valor:', sample.completed, 'Tipo:', typeof sample.completed);
            console.log('[DEBUG] volunteerId -', 'Valor:', sample.volunteerId, 'Tipo:', typeof sample.volunteerId);
            console.log('[DEBUG] status -', 'Valor:', sample.status, 'Tipo:', typeof sample.status);
            console.log('[DEBUG] requestStatus -', 'Valor:', sample.requestStatus, 'Tipo:', typeof sample.requestStatus);
            console.log('[DEBUG] needs_volunteer -', 'Valor:', sample.needs_volunteer, 'Tipo:', typeof sample.needs_volunteer);
            
            // Verificar si hay conversiones implícitas en las comparaciones
            console.log('[DEBUG] EVALUACIÓN DE CONDICIONES:');
            console.log('[DEBUG] sample.completed === 1:', sample.completed === 1);
            console.log('[DEBUG] sample.completed == 1:', sample.completed == 1);
            console.log('[DEBUG] Boolean(sample.volunteerId):', Boolean(sample.volunteerId));
            console.log('[DEBUG] sample.needs_volunteer === 1:', sample.needs_volunteer === 1);
            console.log('[DEBUG] sample.needs_volunteer == 1:', sample.needs_volunteer == 1);
        }
        
        // Clasificar los recordatorios por estado
        const pendingReminders = [];
        const acceptedReminders = [];
        const completedReminders = [];
        
        reminders.forEach(reminder => {
            console.log('[DEBUG] Processing reminder:', reminder.id, 
                      'Type:', reminder.type, 
                      'Status:', reminder.status, 
                      'RequestStatus:', reminder.requestStatus, 
                      'Completed:', reminder.completed, 
                      'VolunteerId:', reminder.volunteerId, 
                      'Needs_volunteer:', reminder.needs_volunteer);
            
            // Detalle de evaluación de condiciones para este recordatorio
            console.log(`[DEBUG] Reminder ${reminder.id} - Evaluación detallada:`);
            console.log(`[DEBUG] - needs_volunteer === 1: ${reminder.needs_volunteer === 1} (valor: ${reminder.needs_volunteer}, tipo: ${typeof reminder.needs_volunteer})`);
            console.log(`[DEBUG] - completed === 1: ${reminder.completed === 1} (valor: ${reminder.completed}, tipo: ${typeof reminder.completed})`);
            console.log(`[DEBUG] - requestStatus === 'accepted': ${reminder.requestStatus === 'accepted'} (valor: ${reminder.requestStatus})`);
            console.log(`[DEBUG] - requestStatus === 'pending': ${reminder.requestStatus === 'pending'} (valor: ${reminder.requestStatus})`);
            console.log(`[DEBUG] - status field: ${reminder.status}`);
            console.log(`[DEBUG] - volunteerId: ${reminder.volunteerId} (tipo: ${typeof reminder.volunteerId}, null check: ${reminder.volunteerId === null})`);
            
            // PRUEBA ALTERNATIVA: Usar requestStatus en lugar de needs_volunteer como condición principal
            console.log(`[DEBUG] PRUEBA ALTERNATIVA DE CLASIFICACIÓN:`);
            if (reminder.completed === 1) {
                console.log(`[DEBUG] - Alternativa: Reminder ${reminder.id} sería COMPLETED`);
            } else if (reminder.volunteerId) {
                console.log(`[DEBUG] - Alternativa: Reminder ${reminder.id} sería ACCEPTED`);
            } else if (reminder.requestStatus === 'pending') {
                console.log(`[DEBUG] - Alternativa: Reminder ${reminder.id} sería PENDING`);
            } else {
                console.log(`[DEBUG] - Alternativa: Reminder ${reminder.id} sería PERSONAL`);
            }
            
            // Lógica original de clasificación con logs adicionales
            try {
                if (reminder.needs_volunteer === 1) {
                    if (reminder.completed === 1) {
                        console.log('[DEBUG] Reminder', reminder.id, 'classified as COMPLETED porque completed === 1');
                        completedReminders.push(reminder);
                    } else if (reminder.requestStatus === 'accepted') {
                        console.log('[DEBUG] Reminder', reminder.id, 'classified as ACCEPTED porque requestStatus === "accepted"');
                        acceptedReminders.push(reminder);
                    } else {
                        console.log('[DEBUG] Reminder', reminder.id, 'classified as PENDING porque needs_volunteer === 1 pero no es completed ni accepted');
                        pendingReminders.push(reminder);
                    }
                } else {
                    // Si no necesita voluntario, se considera un recordatorio personal
                    console.log('[DEBUG] Reminder', reminder.id, 'classified as PERSONAL porque needs_volunteer !== 1');
                    pendingReminders.push(reminder);
                }
            } catch (error) {
                console.error('[DEBUG] Error al clasificar recordatorio:', error, 'Recordatorio:', JSON.stringify(reminder));
                console.error('[DEBUG] Stack trace:', error.stack);
                // No modificamos la lógica en caso de error, solo registramos el error
                throw error; // Re-lanzar el error para que se capture en fetchReminders
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
        
        // Ordenar recordatorios completados por fecha (más recientes primero)
        completedReminders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Mostrar mensaje si no hay recordatorios completados
        if (completedReminders.length === 0) {
            completedRemindersList.innerHTML = '<li><p>No completed appointments.</p></li>';
            showMoreButton.style.display = 'none';
        } else {
            // Guardar todos los recordatorios completados como atributos de datos en el contenedor
            completedRemindersList.dataset.totalReminders = JSON.stringify(completedReminders);
            
            // Inicialmente, mostrar solo los primeros MAX_VISIBLE_COMPLETED recordatorios
            const initialVisible = Math.min(MAX_VISIBLE_COMPLETED, completedReminders.length);
            
            for (let i = 0; i < initialVisible; i++) {
                const li = createReminderItem(completedReminders[i]);
                completedRemindersList.appendChild(li);
            }
            
            // Mostrar u ocultar el botón "Show More" según sea necesario
            if (completedReminders.length > MAX_VISIBLE_COMPLETED) {
                if (showMoreButton) {
                    showMoreButton.style.display = 'block';
                    showMoreButton.textContent = showAllCompleted ? 'Show Less' : `Show More (${completedReminders.length - MAX_VISIBLE_COMPLETED} more)`;
                }
                
                // Determinar cuántos recordatorios mostrar
                const visibleCount = showAllCompleted ? completedReminders.length : Math.min(MAX_VISIBLE_COMPLETED, completedReminders.length);
                console.log('[DEBUG] Mostrando', visibleCount, 'de', completedReminders.length, 'recordatorios completados');
                
                // Mostrar los recordatorios completados
                for (let i = 0; i < visibleCount; i++) {
                    const li = createReminderItem(completedReminders[i]);
                    completedRemindersList.appendChild(li);
                }
            } else {
                if (showMoreButton) {
                    showMoreButton.style.display = 'none';
                }
            }
        }
        
        // Logs finales de depuración para ver el resultado de la clasificación
        console.log('[DEBUG] renderReminders - FINAL COUNTS:');
        console.log('[DEBUG] renderReminders - Pending reminders:', pendingReminders.length);
        console.log('[DEBUG] renderReminders - Accepted reminders:', acceptedReminders.length);
        console.log('[DEBUG] renderReminders - Completed reminders:', completedReminders.length);
        
        // Analizar los recordatorios pendientes en detalle
        if (pendingReminders.length > 0) {
            console.log('[DEBUG] renderReminders - Pending reminders details:');
            pendingReminders.forEach(reminder => {
                console.log('[DEBUG] Pending reminder:', reminder.id,
                          'Type:', reminder.type,
                          'Status:', reminder.status,
                          'RequestStatus:', reminder.requestStatus,
                          'Completed:', reminder.completed,
                          'VolunteerId:', reminder.volunteerId,
                          'Needs_volunteer:', reminder.needs_volunteer);
            });
        } else {
            console.log('[DEBUG] renderReminders - No pending reminders found');
        }
    };

    // Función de depuración para analizar recordatorios pendientes
    const debugAnalyzePendingReminders = (reminders) => {
        console.log('[DEBUG] ======= ANÁLISIS DETALLADO DE RECORDATORIOS PENDIENTES =======');
        
        // Filtrar recordatorios que deberían ser pendientes según diferentes criterios
        const pendingByStatus = reminders.filter(r => r.status === 'pending');
        const pendingByRequestStatus = reminders.filter(r => r.requestStatus === 'pending');
        const pendingByNoVolunteer = reminders.filter(r => !r.volunteerId && r.needs_volunteer === 1);
        const pendingByNotCompleted = reminders.filter(r => r.completed !== 1 && !r.volunteerId && r.needs_volunteer === 1);
        
        console.log('[DEBUG] Recordatorios con status="pending":', pendingByStatus.length);
        console.log('[DEBUG] Recordatorios con requestStatus="pending":', pendingByRequestStatus.length);
        console.log('[DEBUG] Recordatorios sin volunteerId y con needs_volunteer=1:', pendingByNoVolunteer.length);
        console.log('[DEBUG] Recordatorios no completados, sin volunteerId y con needs_volunteer=1:', pendingByNotCompleted.length);
        
        // Verificar si hay discrepancias entre status y requestStatus
        const discrepancies = reminders.filter(r => {
            if (r.status === 'pending' && r.requestStatus !== 'pending') return true;
            if (r.status === 'accepted' && r.requestStatus !== 'accepted') return true;
            if (r.status === 'completed' && r.completed !== 1) return true;
            return false;
        });
        
        if (discrepancies.length > 0) {
            console.log('[DEBUG] ¡ATENCIÓN! Se encontraron discrepancias entre status y requestStatus:');
            discrepancies.forEach(r => {
                console.log(`[DEBUG] Recordatorio ID ${r.id}: status=${r.status}, requestStatus=${r.requestStatus}, completed=${r.completed}`);
            });
        } else {
            console.log('[DEBUG] No se encontraron discrepancias entre status y requestStatus');
        }
        
        // Verificar recordatorios que podrían estar mal clasificados
        const potentialMisclassified = reminders.filter(r => {
            // Debería ser pendiente pero no tiene status='pending'
            if (!r.volunteerId && r.needs_volunteer === 1 && r.completed !== 1 && r.status !== 'pending') return true;
            // Debería ser aceptado pero no tiene status='accepted'
            if (r.volunteerId && r.completed !== 1 && r.status !== 'accepted') return true;
            // Debería ser completado pero no tiene status='completed'
            if (r.completed === 1 && r.status !== 'completed') return true;
            return false;
        });
        
        if (potentialMisclassified.length > 0) {
            console.log('[DEBUG] ¡ATENCIÓN! Posibles recordatorios mal clasificados:');
            potentialMisclassified.forEach(r => {
                console.log(`[DEBUG] Recordatorio ID ${r.id}: status=${r.status}, volunteerId=${r.volunteerId}, needs_volunteer=${r.needs_volunteer}, completed=${r.completed}`);
            });
        } else {
            console.log('[DEBUG] No se encontraron recordatorios potencialmente mal clasificados');
        }
        
        console.log('[DEBUG] ======= FIN DEL ANÁLISIS =======');
    };
    
    const fetchReminders = async () => {
        try {
            console.log('[DEBUG] fetchReminders - Starting fetch for user:', user.id);
            console.log('[DEBUG] fetchReminders - User object:', JSON.stringify(user));
            console.log('[DEBUG] fetchReminders - Request URL:', `/api/reminders?userId=${user.id}`);
            
            // Verificar que los elementos DOM existen antes de continuar
            console.log('[DEBUG] Verificando elementos DOM:');
            console.log('[DEBUG] pendingRemindersList existe:', !!pendingRemindersList);
            console.log('[DEBUG] acceptedRemindersList existe:', !!acceptedRemindersList);
            console.log('[DEBUG] completedRemindersList existe:', !!completedRemindersList);
            
            try {
                const startTime = new Date().getTime();
                const response = await fetch(`/api/reminders?userId=${user.id}`);
                const endTime = new Date().getTime();
                
                console.log('[DEBUG] fetchReminders - Response received in', (endTime - startTime), 'ms');
                console.log('[DEBUG] fetchReminders - Response status:', response.status);
                console.log('[DEBUG] fetchReminders - Response headers:', [...response.headers.entries()]);
                
                if (response.ok) {
                    try {
                        const responseText = await response.text();
                        console.log('[DEBUG] fetchReminders - Response text:', responseText.substring(0, 200) + '...');
                        
                        try {
                            const reminders = JSON.parse(responseText);
                            console.log('[DEBUG] fetchReminders - Reminders parsed successfully');
                            console.log('[DEBUG] fetchReminders - Reminders received:', reminders.length);
                            console.log('[DEBUG] fetchReminders - First reminder (if any):', JSON.stringify(reminders[0] || 'None'));
                            
                            try {
                                // Analizar los recordatorios recibidos
                                const pendingCount = reminders.filter(r => r.requestStatus === 'pending').length;
                                const acceptedCount = reminders.filter(r => r.requestStatus === 'accepted').length;
                                const completedCount = reminders.filter(r => r.completed === 1).length;
                                
                                console.log('[DEBUG] fetchReminders - Counts before rendering - Pending:', pendingCount, 'Accepted:', acceptedCount, 'Completed:', completedCount);
                                
                                try {
                                    // Ejecutar análisis detallado de recordatorios pendientes
                                    console.log('[DEBUG] fetchReminders - Llamando a debugAnalyzePendingReminders...');
                                    debugAnalyzePendingReminders(reminders);
                                    console.log('[DEBUG] fetchReminders - debugAnalyzePendingReminders completado exitosamente');
                                    
                                    try {
                                        console.log('[DEBUG] fetchReminders - Llamando a renderReminders...');
                                        renderReminders(reminders);
                                        console.log('[DEBUG] fetchReminders - renderReminders completado exitosamente');
                                    } catch (renderError) {
                                        console.error('[DEBUG] fetchReminders - Error en renderReminders:', renderError);
                                        console.error('[DEBUG] fetchReminders - Stack trace:', renderError.stack);
                                        console.error('[DEBUG] fetchReminders - Tipo de error:', renderError.name);
                                        console.error('[DEBUG] fetchReminders - Mensaje de error:', renderError.message);
                                        if (pendingRemindersList) {
                                            pendingRemindersList.innerHTML = '<li><p>Error rendering appointments.</p></li>';
                                        }
                                    }
                                } catch (analyzeError) {
                                    console.error('[DEBUG] fetchReminders - Error en debugAnalyzePendingReminders:', analyzeError);
                                    console.error('[DEBUG] fetchReminders - Stack trace:', analyzeError.stack);
                                    // Continuar con renderReminders a pesar del error en el análisis
                                    try {
                                        renderReminders(reminders);
                                    } catch (renderError) {
                                        console.error('[DEBUG] Error secundario en renderReminders:', renderError);
                                    }
                                }
                            } catch (filterError) {
                                console.error('[DEBUG] fetchReminders - Error al filtrar recordatorios:', filterError);
                                console.error('[DEBUG] fetchReminders - Stack trace:', filterError.stack);
                                // Intentar renderizar de todos modos
                                try {
                                    renderReminders(reminders);
                                } catch (renderError) {
                                    console.error('[DEBUG] Error secundario en renderReminders:', renderError);
                                }
                            }
                        } catch (parseError) {
                            console.error('[DEBUG] fetchReminders - Error parsing JSON response:', parseError);
                            console.error('[DEBUG] fetchReminders - Stack trace:', parseError.stack);
                            console.error('[DEBUG] fetchReminders - Response text that failed to parse:', responseText);
                            if (pendingRemindersList) {
                                pendingRemindersList.innerHTML = '<li><p>Error parsing server response.</p></li>';
                            }
                        }
                    } catch (textError) {
                        console.error('[DEBUG] fetchReminders - Error getting response text:', textError);
                        console.error('[DEBUG] fetchReminders - Stack trace:', textError.stack);
                        if (pendingRemindersList) {
                            pendingRemindersList.innerHTML = '<li><p>Error reading server response.</p></li>';
                        }
                    }
                } else {
                    const errorText = await response.text();
                    console.error('[DEBUG] fetchReminders - Failed to fetch reminders. Status:', response.status, 'Error:', errorText);
                    if (pendingRemindersList) {
                        pendingRemindersList.innerHTML = '<li><p>Could not load your appointments. Please try again later.</p></li>';
                    }
                }
            } catch (fetchError) {
                console.error('[DEBUG] fetchReminders - Error during fetch operation:', fetchError);
                console.error('[DEBUG] fetchReminders - Stack trace:', fetchError.stack);
                if (pendingRemindersList) {
                    pendingRemindersList.innerHTML = '<li><p>Network error while loading appointments.</p></li>';
                }
            }
        } catch (error) {
            console.error('[DEBUG] fetchReminders - Error general en fetchReminders:', error);
            console.error('[DEBUG] fetchReminders - Stack trace:', error.stack);
            if (pendingRemindersList) {
                pendingRemindersList.innerHTML = '<li><p>An error occurred while loading your appointments.</p></li>';
            }
        }
    };

    // Cargar recordatorios al cargar la página
    fetchReminders();
});
