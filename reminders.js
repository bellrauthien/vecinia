document.addEventListener('DOMContentLoaded', () => {
    const remindersList = document.getElementById('reminders-list');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const renderReminders = (reminders) => {
        remindersList.innerHTML = '';
        if (reminders.length === 0) {
            remindersList.innerHTML = '<li><p>You have no upcoming appointments.</p></li>';
            return;
        }

        reminders.forEach(reminder => {
            const li = document.createElement('li');
            li.classList.add('reminder-item-simple');
            li.dataset.id = reminder.id; // Store reminder ID

            li.innerHTML = `
                <div>
                    <strong class="reminder-type-tag">${reminder.type.replace('-', ' ')}</strong>
                    <span>${reminder.note}</span>
                    ${reminder.address ? `<span class="reminder-address-display">📍 ${reminder.address}</span>` : ''}
                </div>
                <span>${new Date(reminder.date).toLocaleDateString()} at ${reminder.time}</span>
            `;

            // Make the entire list item clickable
            li.addEventListener('click', () => {
                window.location.href = `new_reminder.html?id=${reminder.id}`;
            });

            remindersList.appendChild(li);
        });
    };

    const fetchReminders = async () => {
        try {
            const response = await fetch(`/api/reminders?userId=${user.id}`);
            if (response.ok) {
                const reminders = await response.json();
                renderReminders(reminders);
            } else {
                console.error('Failed to fetch reminders');
                remindersList.innerHTML = '<li><p>Could not load your appointments. Please try again later.</p></li>';
            }
        } catch (error) {
            console.error('Error fetching reminders:', error);
            remindersList.innerHTML = '<li><p>An error occurred while loading your appointments.</p></li>';
        }
    };

    fetchReminders();
});
