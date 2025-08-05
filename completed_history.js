document.addEventListener('DOMContentLoaded', () => {
    const completedRemindersList = document.getElementById('completed-reminders-list');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Function to delete a reminder
    const deleteReminder = async (id) => {
        if (confirm('Are you sure you want to delete this appointment?')) {
            try {
                const response = await fetch(`/api/reminders/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    // Update the list of reminders
                    fetchCompletedReminders();
                } else {
                    alert('Could not delete the appointment. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting the appointment:', error);
                alert('An error occurred while deleting the appointment.');
            }
        }
    };
    
    // Function to create a reminder item
    const createReminderItem = (reminder) => {
        const li = document.createElement('li');
        li.classList.add('reminder-item-simple');
        li.dataset.id = reminder.id; // Store reminder ID

        // Create a container for the main content of the reminder
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('reminder-content');
        
        // Determine the status and corresponding CSS class
        let statusBadge = '';
        if (reminder.needs_volunteer === 1) {
            statusBadge = `<span class="status-badge completed">Completed</span>`;
        }
        
        // Volunteer information if available
        let volunteerInfo = '';
        if (reminder.volunteerName) {
            // Create rating information if available
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
                ${reminder.address ? `<span class="reminder-address-display">📍 ${reminder.address}</span>` : ''}
                ${volunteerInfo}
            </div>
            <span>${new Date(reminder.date).toLocaleDateString()} at ${reminder.time}</span>
        `;
        
        // Make the content clickable for editing
        contentDiv.addEventListener('click', () => {
            window.location.href = `new_reminder.html?id=${reminder.id}`;
        });
        
        // Create the delete button
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.innerHTML = '🗑️';
        deleteButton.title = 'Delete appointment';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from propagating to li
            deleteReminder(reminder.id);
        });
        
        // Add the content and button to the list item
        li.appendChild(contentDiv);
        li.appendChild(deleteButton);
        
        return li;
    };

    const fetchCompletedReminders = async () => {
        try {
            console.log('Fetching completed reminders for user:', user.id);
            // Use the correct endpoint to get completed reminders
            const response = await fetch(`/api/reminders?userId=${user.id}&completed=1`);
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const reminders = await response.json();
                console.log('Completed reminders received:', reminders);
                
                // Clear the list
                completedRemindersList.innerHTML = '';
                
                if (reminders.length === 0) {
                    completedRemindersList.innerHTML = '<li><p>You have no completed appointments.</p></li>';
                    return;
                }
                
                // Sort reminders by date (most recent first)
                reminders.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Render all completed reminders
                reminders.forEach(reminder => {
                    const li = createReminderItem(reminder);
                    completedRemindersList.appendChild(li);
                });
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch completed reminders. Status:', response.status, 'Error:', errorText);
                completedRemindersList.innerHTML = '<li><p>Could not load your completed appointments. Please try again later.</p></li>';
            }
        } catch (error) {
            console.error('Error fetching completed reminders:', error);
            completedRemindersList.innerHTML = '<li><p>An error occurred while loading your completed appointments.</p></li>';
        }
    };

    // Cargar recordatorios completados al cargar la página
    fetchCompletedReminders();
});
