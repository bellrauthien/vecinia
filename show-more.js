// Script simple para manejar la funcionalidad de "Show More" / "Show Less"
document.addEventListener('DOMContentLoaded', function() {
    const showMoreButton = document.getElementById('show-more-completed');
    
    if (showMoreButton) {
        showMoreButton.addEventListener('click', function() {
            const completedList = document.getElementById('completed-reminders-list');
            const allItems = completedList.querySelectorAll('li');
            
            // Si el botón dice "Show More", mostrar todos los elementos
            if (this.textContent.includes('Show More')) {
                // Mostrar todos los elementos
                allItems.forEach(item => {
                    item.style.display = 'flex';
                });
                
                // Cambiar el texto del botón a "Show Less"
                this.textContent = 'Show Less';
            } else {
                // Si el botón dice "Show Less", ocultar elementos después del tercero
                for (let i = 0; i < allItems.length; i++) {
                    if (i >= 3) {
                        allItems[i].style.display = 'none';
                    }
                }
                
                // Cambiar el texto del botón a "Show More"
                const hiddenCount = allItems.length - 3;
                this.textContent = `Show More (${hiddenCount} more)`;
            }
        });
    }
});
