// Script muy simple para el botón Show More
document.addEventListener('DOMContentLoaded', function() {
    // Obtener el botón Show More
    const showMoreButton = document.getElementById('show-more-completed');
    
    if (!showMoreButton) {
        console.error('Show More button not found');
        return;
    }
    
    console.log('Show More button found:', showMoreButton);
    
    // Añadir un evento de clic al botón
    showMoreButton.addEventListener('click', function() {
        console.log('Show More button clicked');
        
        // Obtener la lista de recordatorios completados
        const completedList = document.getElementById('completed-reminders-list');
        if (!completedList) {
            console.error('Completed reminders list not found');
            return;
        }
        
        // Obtener todos los elementos de la lista
        const items = completedList.querySelectorAll('li');
        console.log('Found', items.length, 'items in the completed list');
        
        // Si el botón dice "Show More", mostrar todos los elementos
        if (this.textContent.includes('Show More')) {
            console.log('Showing all items');
            
            // Mostrar todos los elementos
            items.forEach(function(item) {
                item.style.display = '';
            });
            
            // Cambiar el texto del botón
            this.textContent = 'Show Less';
        } else {
            console.log('Hiding items after the third one');
            
            // Ocultar elementos después del tercero
            items.forEach(function(item, index) {
                if (index >= 3) {
                    item.style.display = 'none';
                }
            });
            
            // Cambiar el texto del botón
            const hiddenCount = items.length - 3;
            this.textContent = 'Show More (' + hiddenCount + ' more)';
        }
    });
    
    // Ocultar elementos después del tercero inicialmente
    const completedList = document.getElementById('completed-reminders-list');
    if (completedList) {
        const items = completedList.querySelectorAll('li');
        
        if (items.length > 3) {
            console.log('Initially hiding items after the third one');
            
            // Ocultar elementos después del tercero
            items.forEach(function(item, index) {
                if (index >= 3) {
                    item.style.display = 'none';
                }
            });
        }
    }
});
