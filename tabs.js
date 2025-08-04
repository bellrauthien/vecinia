// Script para manejar las pestañas en la página de recordatorios
document.addEventListener('DOMContentLoaded', () => {
    // Seleccionar todos los botones de pestañas y contenidos
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Añadir event listeners a cada botón de pestaña
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Actualizar botones
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Actualizar contenido
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
});
