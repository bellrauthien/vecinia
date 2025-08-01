document.addEventListener('DOMContentLoaded', () => {
    const acceptedContainer = document.getElementById('accepted-requests-list');
    const availableContainer = document.getElementById('available-requests-list');
    const pastContainer = document.getElementById('past-requests-list');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || user.profileType !== 'volunteer') {
        window.location.href = 'login.html';
        return;
    }

    const fetchAcceptedRequests = async () => {
        try {
            const response = await fetch(`/api/requests/accepted?volunteerId=${user.id}`);
            const requests = await response.json();
            acceptedContainer.innerHTML = '';
            if (requests.length === 0) {
                acceptedContainer.innerHTML = '<p>You have not accepted any requests yet.</p>';
                return;
            }
            requests.forEach(request => {
                const el = document.createElement('div');
                el.className = 'reminder-item-simple accepted';
                el.innerHTML = `
                    <div>
                        <span class="reminder-type-tag">${request.type}</span>
                        <strong>${request.note}</strong>
                        <p>${new Date(request.date).toLocaleDateString()} at ${request.time}</p>
                        <small class="reminder-address-display">Contact: ${request.seniorFirstName} ${request.seniorLastName} at ${request.seniorPhone}</small>
                    </div>
                    <button class="action-button cancel-button" data-id="${request.id}">Cancel</button>
                `;
                acceptedContainer.appendChild(el);
                el.querySelector('.cancel-button').addEventListener('click', (e) => cancelRequest(e.target.dataset.id));
            });
        } catch (error) {
            console.error('Error fetching accepted requests:', error);
            acceptedContainer.innerHTML = '<p>Could not load your accepted requests.</p>';
        }
    };

    const fetchAvailableRequests = async () => {
        if (!user.province) {
            availableContainer.innerHTML = '<p>Please <a href="volunteer_profile.html">set your province</a> to see available requests.</p>';
            return;
        }
        try {
            const response = await fetch(`/api/requests/pending?province=${user.province}`);
            const requests = await response.json();
            availableContainer.innerHTML = '';
            if (requests.length === 0) {
                availableContainer.innerHTML = '<p>No available requests in your province.</p>';
                return;
            }
            requests.forEach(request => {
                const el = document.createElement('div');
                el.className = 'reminder-item-simple';
                el.innerHTML = `
                    <div>
                        <span class="reminder-type-tag">${request.type}</span>
                        <strong>${request.note}</strong>
                        <p>${new Date(request.date).toLocaleDateString()} at ${request.time}</p>
                    </div>
                    <button class="action-button accept-button" data-id="${request.id}">Accept</button>
                `;
                availableContainer.appendChild(el);
            });
            document.querySelectorAll('.accept-button').forEach(button => {
                button.addEventListener('click', (e) => acceptRequest(e.target.dataset.id));
            });
        } catch (error) {
            console.error('Error fetching available requests:', error);
            availableContainer.innerHTML = '<p>Could not load available requests.</p>';
        }
    };

    const cancelRequest = async (reminderId) => {
        try {
            const response = await fetch('/api/requests/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reminderId })
            });
            if (response.ok) {
                fetchAcceptedRequests();
                fetchAvailableRequests();
                fetchPastRequests(); // Also refresh past requests in case one was moved
            } else {
                alert('Failed to cancel the request.');
            }
        } catch (error) {
            console.error('Error cancelling request:', error);
            alert('An error occurred while cancelling.');
        }
    };

    const acceptRequest = async (reminderId) => {
        try {
            const response = await fetch('/api/requests/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reminderId, volunteerId: user.id })
            });
            if (response.ok) {
                // Refresh both lists to show the change
                fetchAcceptedRequests();
                fetchAvailableRequests();
                fetchPastRequests();
            } else {
                alert('Failed to accept the request. It might have been taken by someone else.');
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            alert('An error occurred.');
        }
    };

    const fetchPastRequests = async () => {
        try {
            const response = await fetch(`/api/requests/past?volunteerId=${user.id}`);
            const requests = await response.json();
            pastContainer.innerHTML = '';
            if (requests.length === 0) {
                pastContainer.innerHTML = '<p>You have no past requests.</p>';
                return;
            }
            requests.forEach(request => {
                const el = document.createElement('div');
                el.className = 'reminder-item-simple past'; // Add a 'past' class for potential styling
                el.innerHTML = `
                    <div>
                        <span class="reminder-type-tag">${request.type}</span>
                        <strong>${request.note}</strong>
                        <p>${new Date(request.date).toLocaleDateString()} at ${request.time}</p>
                        <small class="reminder-address-display">Assisted: ${request.seniorFirstName} ${request.seniorLastName}</small>
                    </div>
                `;
                pastContainer.appendChild(el);
            });
        } catch (error) {
            console.error('Error fetching past requests:', error);
            pastContainer.innerHTML = '<p>Could not load your past requests.</p>';
        }
    };

    fetchAcceptedRequests();
    fetchAvailableRequests();
    fetchPastRequests();
});
