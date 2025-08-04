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
            container.innerHTML = '<p class="no-activities">No completed activities found. When you complete activities with seniors, they will appear here for rating.</p>';
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
                    <p><strong>Senior:</strong> ${activity.seniorFirstName} ${activity.seniorLastName}</p>
                    <p><strong>Phone:</strong> ${activity.seniorPhone || 'N/A'}</p>
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
        container.innerHTML = '<p class="error-message">Error loading completed activities. Please try again later.</p>';
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
    title.textContent = `Rate this senior`;
    form.appendChild(title);
    
    let currentRating = 0;
    
    // Crear estrellas de calificación
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'rating-stars';
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'rating-star empty';
        star.innerHTML = '★'; // Estrella
        star.style.cursor = 'pointer';
        star.addEventListener('click', () => {
            currentRating = i;
            updateStars(i);
            submitButton.disabled = false;
        });
        
        ratingContainer.appendChild(star);
    }
    
    form.appendChild(ratingContainer);
    
    // Función para actualizar la visualización de las estrellas
    function updateStars(rating) {
        const stars = ratingContainer.querySelectorAll('.rating-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('empty');
            } else {
                star.classList.add('empty');
            }
        });
    }
    
    // Crear campo de comentario
    const commentLabel = document.createElement('label');
    commentLabel.textContent = 'Comment (optional):';
    form.appendChild(commentLabel);
    
    const commentTextarea = document.createElement('textarea');
    commentTextarea.placeholder = 'Write a comment about your experience...';
    form.appendChild(commentTextarea);
    
    // Crear botón de envío
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit Rating';
    submitButton.disabled = true;
    submitButton.addEventListener('click', async () => {
        if (currentRating === 0) return;
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            
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
                    comment: commentTextarea.value.trim()
                })
            });
            
            if (response.ok) {
                if (onSubmitSuccess) {
                    onSubmitSuccess();
                }
                
                form.innerHTML = '';
                const successMessage = document.createElement('div');
                successMessage.className = 'message-container';
                successMessage.innerHTML = '<p class="success-message">Thank you for your rating!</p>';
                form.appendChild(successMessage);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error submitting rating');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Rating';
            
            const errorMessage = document.createElement('p');
            errorMessage.className = 'error-message';
            errorMessage.textContent = error.message || 'An error occurred while submitting your rating';
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
