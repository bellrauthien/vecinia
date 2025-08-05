// Función para cargar y mostrar actividades completadas
async function loadCompletedActivities(userId) {
    const container = document.getElementById('completed-activities-container');
    const loadingMessage = document.getElementById('loading-message');
    
    console.log('Loading completed activities for user ID:', userId);
    
    try {
        // Obtener actividades completadas donde el usuario es el voluntario
        console.log('Fetching from URL:', `/api/volunteer-completed-activities?volunteerId=${userId}`);
        const response = await fetch(`/api/volunteer-completed-activities?volunteerId=${userId}`);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to fetch completed activities: ${response.status} ${errorText}`);
        }
        
        const activities = await response.json();
        
        // Eliminar mensaje de carga
        if (loadingMessage) {
            loadingMessage.remove();
        }
        
        if (activities.length === 0) {
            container.innerHTML = '<div class="no-data-message"><i class="fas fa-info-circle"></i> No hay actividades completadas. Cuando completes actividades con mayores, aparecerán aquí para valorarlas.</div>';
            return;
        }
        
        // Mostrar cada actividad completada
        activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            
            // Formatear la fecha
            const activityDate = new Date(activity.date).toLocaleDateString();
            
            activityElement.innerHTML = `
                <div class="activity-header">
                    <strong>${activity.type}</strong>
                    <span class="activity-date">${activityDate} - ${activity.time}</span>
                </div>
                <p class="activity-details">${activity.note}</p>
                <div class="senior-info">
                    <div class="senior-header">
                        <i class="fas fa-user-circle"></i>
                        <span><strong>Mayor:</strong> ${activity.seniorFirstName} ${activity.seniorLastName}</span>
                    </div>
                    <div class="senior-contact">
                        <i class="fas fa-phone"></i> ${activity.seniorPhone || 'N/A'}
                    </div>
                </div>
            `;
            
            // Añadir sección de calificación
            const ratingSection = document.createElement('div');
            ratingSection.className = 'rating-section';
            ratingSection.id = `rating-section-${activity.id}`;
            activityElement.appendChild(ratingSection);
            
            // Verificar si el voluntario puede calificar al senior
            console.log('Checking if volunteer can rate senior for activity:', activity.id);
            checkAndShowRatingForm(activity, userId, ratingSection);
            
            container.appendChild(activityElement);
        });
    } catch (error) {
        console.error('Error loading completed activities:', error);
        container.innerHTML = '<div class="message-container error show"><i class="fas fa-exclamation-circle"></i> Error al cargar las actividades completadas. Por favor, inténtalo de nuevo más tarde.</div>';
    }
}

// Función para verificar si un usuario puede calificar un recordatorio
async function canUserRateReminder(reminderId, userId) {
    try {
        console.log('Checking if user can rate reminder:', reminderId);
        const response = await fetch(`/api/reminders/${reminderId}/can-rate?userId=${userId}`);
        if (response.ok) {
            const data = await response.json();
            console.log('Can rate response:', data);
            return data;
        }
        return { canRate: false, reason: 'Error checking rating eligibility' };
    } catch (error) {
        console.error('Error checking if user can rate:', error);
        return { canRate: false, reason: 'Error checking rating eligibility' };
    }
}

// Función para crear un formulario de calificación
function createRatingForm(reminderId, raterId, ratedId, userRole, onSubmitSuccess) {
    console.log('Creating rating form for reminder:', reminderId);
    const form = document.createElement('div');
    form.className = 'rating-form';
    
    const title = document.createElement('h3');
    title.textContent = `Valora a este mayor`;
    form.appendChild(title);
    
    let currentRating = 0;
    
    // Crear estrellas de calificación con Font Awesome
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'star-rating';
    ratingContainer.setAttribute('data-activity-id', reminderId);
    
    // Añadir contador de valoración
    const ratingValue = document.createElement('span');
    ratingValue.className = 'rating-value';
    ratingValue.textContent = '0/5';
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('button');
        star.className = 'star';
        star.setAttribute('data-value', i);
        star.innerHTML = '<i class="fas fa-star"></i>';
        star.addEventListener('click', () => {
            currentRating = i;
            updateStars(i);
            ratingValue.textContent = `${currentRating}/5`;
            submitButton.disabled = false;
        });
        
        ratingContainer.appendChild(star);
    }
    
    ratingContainer.appendChild(ratingValue);
    
    form.appendChild(ratingContainer);
    
    // Función para actualizar la visualización de las estrellas
    function updateStars(rating) {
        const stars = ratingContainer.querySelectorAll('.star');
        stars.forEach((star) => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    // Crear campo de comentario
    const commentInput = document.createElement('textarea');
    commentInput.placeholder = 'Deja un comentario sobre tu experiencia (opcional)';
    commentInput.maxLength = 200;
    form.appendChild(commentInput);
    
    // Crear botón de envío
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary submit-rating';
    submitButton.textContent = 'Enviar valoración';
    submitButton.disabled = true;
    submitButton.addEventListener('click', async () => {
        if (currentRating === 0) return;
        
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            
            // Enviar calificación al servidor
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reminderId,
                    raterId,
                    ratedId,
                    score: currentRating,
                    comment: commentInput.value.trim()
                })
            });
            
            if (response.ok) {
                console.log('Rating submitted successfully');
                
                // Mostrar mensaje de éxito
                form.innerHTML = '<div class="rated-message"><p>¡Valoración enviada con éxito!</p></div>';
                
                // Llamar al callback de éxito si se proporciona
                if (typeof onSubmitSuccess === 'function') {
                    onSubmitSuccess();
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit rating');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            submitButton.innerHTML = 'Enviar valoración';
            submitButton.disabled = false;
            
            // Mostrar mensaje de error
            const errorMessage = document.createElement('div');
            errorMessage.className = 'message-container error show';
            errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error: ${error.message}`;
            form.appendChild(errorMessage);
        }
    });
    
    form.appendChild(submitButton);
    return form;
}

// Función para verificar si el usuario puede calificar y mostrar el formulario de calificación
async function checkAndShowRatingForm(reminder, userId, container) {
    console.log('checkAndShowRatingForm called with reminder ID:', reminder.id, 'and user ID:', userId);
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
                    // Reemplazar el contenido de la sección de calificación con un mensaje de éxito
                    // en lugar de recargar todas las actividades
                    setTimeout(() => {
                        container.innerHTML = '<div class="rated-message"><p>Rating submitted successfully!</p></div>';
                    }, 2000);
                }
            );
            
            container.appendChild(ratingForm);
        } else if (canRateResponse.hasRated) {
            // Si ya ha calificado, mostrar mensaje
            const ratedMessage = document.createElement('div');
            ratedMessage.className = 'rated-message';
            ratedMessage.innerHTML = '<p>You have already rated this senior.</p>';
            container.appendChild(ratedMessage);
        }
    } catch (error) {
        console.error('Error checking rating eligibility:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.profileType !== 'volunteer') {
        window.location.href = 'login.html';
        return;
    }

    // Actualizar el título con el nombre del usuario
    document.title = `Completed Activities - ${user.firstName}`;
    
    // Cargar actividades completadas
    loadCompletedActivities(user.id);
});
