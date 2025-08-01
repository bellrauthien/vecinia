document.addEventListener('DOMContentLoaded', () => {
    const detailsContainer = document.getElementById('request-details-container');
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

                if (request.status === 'accepted' || request.volunteerId) {
                    acceptButton.textContent = 'Already Accepted';
                    acceptButton.disabled = true;
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
