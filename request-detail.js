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

document.addEventListener('DOMContentLoaded', () => {
    const detailsContainer = document.getElementById('request-details-container');
    const seniorRatingContainer = document.getElementById('senior-rating-container');
    const completeSection = document.getElementById('complete-section');
    const ratingSection = document.getElementById('rating-section');
    const acceptButton = document.getElementById('accept-request-button');
    const messageContainer = document.getElementById('message-container');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.profileType !== 'volunteer') {
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const reminderId = urlParams.get('id');

    if (!reminderId) {
        detailsContainer.innerHTML = '<p>No request ID provided.</p>';
        acceptButton.style.display = 'none';
        return;
    }

    const fetchRequestDetails = async () => {
        try {
            const response = await fetch(`/api/reminders/${reminderId}`);
            const request = await response.json();

            if (response.ok) {
                detailsContainer.innerHTML = `
                    <p><strong>Senior:</strong> ${request.seniorFirstName} ${request.seniorLastName}</p>
                    <p><strong>Phone:</strong> ${request.seniorPhone}</p>
                    <p><strong>Type:</strong> ${request.type}</p>
                    <p><strong>Details:</strong> ${request.note}</p>
                    <p><strong>Date:</strong> ${new Date(request.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${request.time}</p>
                    <p><strong>Province:</strong> ${request.province}</p>
                `;
                
                // Mostrar la calificación del senior
                if (request.seniorRating > 0) {
                    const ratingDiv = document.createElement('div');
                    ratingDiv.className = 'user-rating-badge';
                    ratingDiv.innerHTML = '<strong>Senior Rating:</strong> ';
                    ratingDiv.appendChild(createRatingStars(request.seniorRating, request.seniorRatingCount));
                    seniorRatingContainer.appendChild(ratingDiv);
                }

                if (request.status === 'accepted' || request.volunteerId) {
                    // Si ya está aceptado por este voluntario
                    if (request.volunteerId == user.id) {
                        acceptButton.textContent = 'You have accepted this request';
                        acceptButton.disabled = true;
                        
                        // Manejar el estado completado/no completado
                        if (request.completed === 1) {
                            // Si está completado, verificar si el usuario puede calificar
                            checkAndShowRatingForm(request, user.id, ratingSection);
                        } else {
                            // Si no está completado, mostrar botón para marcar como completado
                            completeSection.style.display = 'block';
                            completeSection.appendChild(createCompleteButton(request.id, () => {
                                // Recargar la página para mostrar la opción de calificar
                                window.location.reload();
                            }));
                        }
                    } else {
                        acceptButton.textContent = 'Already Accepted by Another Volunteer';
                        acceptButton.disabled = true;
                    }
                }

            } else {
                detailsContainer.innerHTML = `<p>${request.error}</p>`;
                acceptButton.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching request details:', error);
            detailsContainer.innerHTML = '<p>An error occurred while fetching details.</p>';
            acceptButton.style.display = 'none';
        }
    };

    const acceptRequest = async () => {
        try {
            const response = await fetch('/api/requests/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reminderId, volunteerId: user.id })
            });

            if (response.ok) {
                displayMessage('Request accepted successfully!', 'success', messageContainer);
                setTimeout(() => {
                    window.location.href = 'requests.html';
                }, 2000);
            } else {
                displayMessage('Failed to accept the request. It might have been taken by someone else.', 'error', messageContainer);
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            displayMessage('An error occurred.', 'error', messageContainer);
        }
    };

    acceptButton.addEventListener('click', acceptRequest);
    fetchRequestDetails();
});
