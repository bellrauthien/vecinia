/**
 * Ratings system for Vecinia
 * This file contains functions for displaying and submitting ratings
 */

// Function to create a star rating display
function createRatingStars(rating, count, interactive = false, onRatingChange = null) {
    const container = document.createElement('div');
    container.className = 'rating-container';
    
    const starsContainer = document.createElement('div');
    starsContainer.className = 'rating-stars';
    
    // Round rating to nearest half star
    const roundedRating = Math.round(rating * 2) / 2;
    
    // Create 5 stars
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'rating-star';
        
        // Determine if this star should be full, half, or empty
        if (i <= roundedRating) {
            star.innerHTML = '★'; // Full star
        } else if (i - 0.5 === roundedRating) {
            star.innerHTML = '★'; // We'll use CSS to style this as a half star
            star.style.opacity = '0.5';
        } else {
            star.innerHTML = '★'; // Empty star (we'll style it with CSS)
            star.classList.add('empty');
        }
        
        // If interactive, add click event
        if (interactive && onRatingChange) {
            star.style.cursor = 'pointer';
            star.addEventListener('click', () => {
                onRatingChange(i);
                updateStarDisplay(starsContainer, i);
            });
            
            // Hover effect
            star.addEventListener('mouseover', () => {
                updateStarDisplay(starsContainer, i, true);
            });
            
            starsContainer.addEventListener('mouseout', () => {
                const selectedRating = parseInt(starsContainer.dataset.rating || '0');
                updateStarDisplay(starsContainer, selectedRating);
            });
        }
        
        starsContainer.appendChild(star);
    }
    
    container.appendChild(starsContainer);
    
    // Add rating count if provided
    if (count !== undefined && count > 0) {
        const countSpan = document.createElement('span');
        countSpan.className = 'rating-count';
        countSpan.textContent = `(${count})`;
        container.appendChild(countSpan);
    }
    
    return container;
}

// Function to update star display when user interacts with stars
function updateStarDisplay(starsContainer, rating, isHover = false) {
    if (!isHover) {
        starsContainer.dataset.rating = rating.toString();
    }
    
    const stars = starsContainer.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('empty');
            star.style.opacity = '1';
        } else {
            star.classList.add('empty');
            star.style.opacity = '1';
        }
    });
}

// Function to create a rating form
// Expuesta globalmente para que pueda ser usada en otros archivos
window.createRatingForm = function(reminderId, raterId, ratedId, userRole, onSubmitSuccess) {
    const form = document.createElement('div');
    form.className = 'rating-form';
    
    const title = document.createElement('h3');
    title.textContent = `Calificar a ${userRole === 'senior' ? 'voluntario' : 'senior'}`;
    form.appendChild(title);
    
    let currentRating = 0;
    
    // Create rating stars
    const ratingContainer = createRatingStars(0, null, true, (rating) => {
        currentRating = rating;
        submitButton.disabled = currentRating === 0;
    });
    form.appendChild(ratingContainer);
    
    // Create comment textarea
    const commentLabel = document.createElement('label');
    commentLabel.textContent = 'Comentario (opcional):';
    commentLabel.setAttribute('for', 'rating-comment');
    form.appendChild(commentLabel);
    
    const commentTextarea = document.createElement('textarea');
    commentTextarea.id = 'rating-comment';
    commentTextarea.placeholder = 'Escribe un comentario sobre tu experiencia...';
    form.appendChild(commentTextarea);
    
    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Enviar calificación';
    submitButton.disabled = true;
    submitButton.addEventListener('click', async () => {
        if (currentRating === 0) return;
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
            
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
                
                // Replace form with success message
                form.innerHTML = '';
                const successMessage = document.createElement('div');
                successMessage.className = 'message-container';
                successMessage.innerHTML = '<p class="success-message">¡Gracias por tu calificación!</p>';
                form.appendChild(successMessage);
                
                // Deshabilitar botones de Update y Delete si existen
                // Buscar todos los botones de acción y el botón de eliminar
                const updateButtons = document.querySelectorAll('.action-button');
                const deleteButton = document.getElementById('delete-button');
                
                // Deshabilitar todos los botones de acción (puede haber más de uno en la página)
                updateButtons.forEach(button => {
                    if (button && button.textContent.includes('Update') || button.textContent.includes('Reminder')) {
                        button.disabled = true;
                        button.style.opacity = '0.5';
                        button.style.cursor = 'not-allowed';
                        console.log('Botón deshabilitado:', button.textContent);
                    }
                });
                
                if (deleteButton) {
                    deleteButton.disabled = true;
                    deleteButton.style.display = 'none';
                    console.log('Botón de eliminar ocultado');
                }
                
                // También intentar con selectores más específicos para la página de recordatorios
                setTimeout(() => {
                    const submitButton = document.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.disabled = true;
                        submitButton.style.opacity = '0.5';
                    }
                }, 500);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al enviar la calificación');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar calificación';
            
            const errorMessage = document.createElement('p');
            errorMessage.className = 'error-message';
            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Ocurrió un error al enviar la calificación';
            form.appendChild(errorMessage);
        }
    });
    form.appendChild(submitButton);
    
    return form;
}

// Function to create a complete button for a reminder
function createCompleteButton(reminderId, onCompleteSuccess) {
    const button = document.createElement('button');
    button.className = 'complete-button';
    button.textContent = 'Marcar como completado';
    
    button.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas marcar esta solicitud como completada?')) {
            try {
                button.disabled = true;
                button.textContent = 'Procesando...';
                
                const response = await fetch(`/api/reminders/${reminderId}/complete`, {
                    method: 'POST'
                });
                
                if (response.ok) {
                    if (onCompleteSuccess) {
                        onCompleteSuccess();
                    }
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al marcar como completado');
                }
            } catch (error) {
                console.error('Error marking as complete:', error);
                button.disabled = false;
                button.textContent = 'Marcar como completado';
                alert('Ocurrió un error al marcar la solicitud como completada');
            }
        }
    });
    
    return button;
}

// Function to check if a user can rate a reminder
// Expuesta globalmente para que pueda ser usada en otros archivos
window.canUserRateReminder = async function(reminderId, userId) {
    try {
        const response = await fetch(`/api/reminders/${reminderId}/can-rate?userId=${userId}`);
        if (response.ok) {
            return await response.json();
        }
        return { canRate: false, reason: 'Error checking rating eligibility' };
    } catch (error) {
        console.error('Error checking if user can rate:', error);
        return { canRate: false, reason: 'Error checking rating eligibility' };
    }
}

// Function to load and display ratings for a user
async function loadUserRatings(userId, container) {
    try {
        container.innerHTML = '<p>Cargando calificaciones...</p>';
        
        const response = await fetch(`/api/users/${userId}/ratings`);
        if (!response.ok) {
            throw new Error('Error fetching ratings');
        }
        
        const ratings = await response.json();
        
        if (ratings.length === 0) {
            container.innerHTML = '<p>Este usuario aún no tiene calificaciones.</p>';
            return;
        }
        
        container.innerHTML = '';
        const ratingsList = document.createElement('div');
        ratingsList.className = 'rating-list';
        
        ratings.forEach(rating => {
            const ratingItem = document.createElement('div');
            ratingItem.className = 'rating-item';
            
            const header = document.createElement('div');
            header.className = 'rating-item-header';
            
            const userSpan = document.createElement('span');
            userSpan.className = 'rating-item-user';
            userSpan.textContent = `${rating.raterFirstName} ${rating.raterLastName}`;
            header.appendChild(userSpan);
            
            const dateSpan = document.createElement('span');
            dateSpan.className = 'rating-item-date';
            const ratingDate = new Date(rating.created_at);
            dateSpan.textContent = ratingDate.toLocaleDateString();
            header.appendChild(dateSpan);
            
            ratingItem.appendChild(header);
            
            const starsContainer = createRatingStars(rating.score);
            ratingItem.appendChild(starsContainer);
            
            if (rating.comment) {
                const commentP = document.createElement('p');
                commentP.className = 'rating-item-comment';
                commentP.textContent = rating.comment;
                ratingItem.appendChild(commentP);
            }
            
            ratingsList.appendChild(ratingItem);
        });
        
        container.appendChild(ratingsList);
    } catch (error) {
        console.error('Error loading ratings:', error);
        container.innerHTML = '<p>Error al cargar las calificaciones.</p>';
    }
}
