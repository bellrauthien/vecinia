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
function createRatingForm(reminderId, raterId, ratedId, userRole, onSubmitSuccess) {
    const form = document.createElement('div');
    form.className = 'rating-form';
    
    const title = document.createElement('h3');
    title.textContent = userRole === 'senior' ? 'Rate your volunteer' : 'Rate this senior';
    form.appendChild(title);
    
    let currentRating = 0;
    
    // Create rating stars with modern design
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'rating-container';
    
    // Create stars container with label
    const ratingLabel = document.createElement('label');
    ratingLabel.className = 'form-label';
    ratingLabel.textContent = 'Your rating:';
    ratingContainer.appendChild(ratingLabel);
    
    const starsContainer = document.createElement('div');
    starsContainer.className = 'rating-stars';
    ratingContainer.appendChild(starsContainer);
    
    // Create rating value display
    const ratingValue = document.createElement('div');
    ratingValue.className = 'rating-value';
    ratingValue.textContent = '0/5';
    ratingContainer.appendChild(ratingValue);
    
    // Create 5 stars with Font Awesome icons
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'rating-star empty';
        star.innerHTML = '<i class="fas fa-star"></i>'; // Font Awesome star
        star.setAttribute('data-value', i);
        star.addEventListener('click', () => {
            currentRating = i;
            updateStarsInContainer(starsContainer, i);
            ratingValue.textContent = `${i}/5`;
            submitButton.disabled = false;
        });
        starsContainer.appendChild(star);
    }
    
    // Función para actualizar las estrellas en el contenedor
    function updateStarsInContainer(container, rating) {
        const stars = container.querySelectorAll('.rating-star');
        stars.forEach(star => {
            const value = parseInt(star.getAttribute('data-value'));
            if (value <= rating) {
                star.classList.remove('empty');
            } else {
                star.classList.add('empty');
            }
        });
    }
    
    form.appendChild(ratingContainer);
    
    // Create comment textarea with modern design
    const commentGroup = document.createElement('div');
    commentGroup.className = 'form-group';
    
    const commentLabel = document.createElement('label');
    commentLabel.textContent = 'Comment (optional):';
    commentLabel.className = 'form-label';
    commentLabel.setAttribute('for', 'rating-comment');
    commentGroup.appendChild(commentLabel);
    
    const commentTextarea = document.createElement('textarea');
    commentTextarea.id = 'rating-comment';
    commentTextarea.className = 'form-control';
    commentTextarea.placeholder = 'Write a comment about your experience...';
    commentGroup.appendChild(commentTextarea);
    
    form.appendChild(commentGroup);
    
    // Create submit button with modern design
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary btn-block';
    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Rating';
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
                
                // Replace form with modern success message
                form.innerHTML = '';
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Thank you for your rating!';
                form.appendChild(successMessage);
                
                // Deshabilitar botones de Update y Delete si existen
                const updateButtons = document.querySelectorAll('.btn');
                const deleteButton = document.getElementById('delete-button');
                
                // Deshabilitar todos los botones de acción (puede haber más de uno en la página)
                updateButtons.forEach(button => {
                    if (button && (button.textContent.includes('Update') || button.textContent.includes('Save'))) {
                        button.disabled = true;
                        button.classList.add('btn-disabled');
                        button.style.pointerEvents = 'none';
                    }
                });
                
                if (deleteButton) {
                    deleteButton.disabled = true;
                    deleteButton.style.display = 'none';
                }
                
                // Ocultar el contenedor de calificación después de un tiempo
                setTimeout(() => {
                    const ratingContainer = form.closest('.rating-form-container');
                    if (ratingContainer) {
                        ratingContainer.style.transition = 'opacity 1s ease';
                        ratingContainer.style.opacity = '0.7';
                    }
                }, 3000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error sending rating');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Rating';
            
            // Mostrar mensaje de error con estilo moderno
            const errorMessage = document.createElement('div');
            errorMessage.className = 'message-container error show';
            errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message || 'An error occurred while submitting your rating'}`;
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
                    // Obtener información del recordatorio para mostrar el formulario de calificación
                    try {
                        const reminderResponse = await fetch(`/api/reminders/${reminderId}`);
                        if (reminderResponse.ok) {
                            const reminderData = await reminderResponse.json();
                            
                            // Crear el contenedor para el formulario de calificación
                            const ratingContainer = document.createElement('div');
                            ratingContainer.className = 'rating-form-container mt-3';
                            ratingContainer.innerHTML = `
                                <div class="card">
                                    <div class="card-header">
                                        <h3 class="card-title"><i class="fas fa-star"></i> Valorar al voluntario</h3>
                                    </div>
                                    <div class="card-body" id="rating-form-${reminderId}"></div>
                                </div>
                            `;
                            
                            // Insertar el contenedor después del botón
                            const parentElement = button.parentElement.parentElement; // li element
                            parentElement.appendChild(ratingContainer);
                            
                            // Ocultar el botón de completar
                            button.parentElement.style.display = 'none';
                            
                            // Crear el formulario de calificación
                            const user = JSON.parse(localStorage.getItem('user'));
                            if (user && reminderData.volunteerId) {
                                const ratingForm = createRatingForm(
                                    reminderId,
                                    user.id,
                                    reminderData.volunteerId,
                                    'senior',
                                    () => {
                                        // Callback cuando se envía la calificación exitosamente
                                        if (onCompleteSuccess) {
                                            onCompleteSuccess();
                                        }
                                    }
                                );
                                
                                // Actualizar el estilo del formulario para el nuevo diseño
                                const formContainer = document.getElementById(`rating-form-${reminderId}`);
                                if (formContainer) {
                                    formContainer.appendChild(ratingForm);
                                    
                                    // Actualizar los estilos de los elementos del formulario
                                    const submitButton = formContainer.querySelector('button');
                                    if (submitButton) {
                                        submitButton.className = 'btn btn-primary btn-block mt-3';
                                    }
                                    
                                    const textarea = formContainer.querySelector('textarea');
                                    if (textarea) {
                                        textarea.className = 'form-control';
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching reminder data:', error);
                    }
                    
                    if (onCompleteSuccess) {
                        // No llamamos al callback aquí para evitar recargar la página
                        // onCompleteSuccess();
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
