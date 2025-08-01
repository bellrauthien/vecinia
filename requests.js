document.addEventListener('DOMContentLoaded', () => {
    const requestsContainer = document.getElementById('requests-list-container');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.profileType !== 'volunteer') {
        window.location.href = 'login.html';
        return;
    }

    const fetchAndDisplayRequests = async () => {
        // Check if the volunteer has their province
        if (!user.province) {
            requestsContainer.innerHTML = '<p>Please <a href="volunteer_profile.html">set your province</a> in your profile to see available requests.</p>';
            return;
        }

        console.log(`Fetching requests for province: ${user.province}`); // Log para depuración
        try {
            const response = await fetch(`/api/requests/pending?province=${user.province}`);
            if (response.ok) {
                const requests = await response.json();
                console.log('Received requests:', requests); // Log para depuración
                requestsContainer.innerHTML = ''; // Clear previous content

                if (requests.length === 0) {
                    requestsContainer.innerHTML = '<p>There are no pending requests in your province at the moment. Thank you for checking!</p>';
                    return;
                }

                requests.forEach(request => {
                    const requestElement = document.createElement('div');
                    requestElement.className = 'reminder-item-simple'; // Reuse existing style
                    requestElement.innerHTML = `
                        <div>
                            <span class="reminder-type-tag">${request.type}</span>
                            <strong>${request.note}</strong>
                            <p>${new Date(request.date).toLocaleDateString()} at ${request.time}</p>
                            ${request.address ? `<small class="reminder-address-display">Address: ${request.address}</small>` : ''}
                        </div>
                        <button class="action-button accept-button" data-id="${request.id}">Accept</button>
                    `;
                    requestsContainer.appendChild(requestElement);
                });

                // Add event listeners to the new buttons
                document.querySelectorAll('.accept-button').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const reminderId = e.target.dataset.id;
                        acceptRequest(reminderId, e.target);
                    });
                });

            } else {
                requestsContainer.innerHTML = '<p>Could not load requests. Please try again later.</p>';
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            requestsContainer.innerHTML = '<p>An error occurred while fetching requests.</p>';
        }
    };

    const acceptRequest = async (reminderId, buttonElement) => {
        try {
            const response = await fetch('/api/requests/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reminderId, volunteerId: user.id })
            });

            if (response.ok) {
                // Update the button and the item's appearance
                buttonElement.textContent = 'Accepted';
                buttonElement.disabled = true;
                buttonElement.closest('.reminder-item-simple').classList.add('accepted');
            } else {
                alert('Failed to accept the request. It might have been taken by someone else.');
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            alert('An error occurred.');
        }
    };

    fetchAndDisplayRequests();
});
