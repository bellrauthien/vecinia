const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vecinia.db');

console.log('Actualizando la estructura de la base de datos...');

// Añadir la columna completed a la tabla reminders si no existe
db.run("ALTER TABLE reminders ADD COLUMN completed BOOLEAN DEFAULT 0", (err) => {
    if (err) {
        // Si el error es porque la columna ya existe, ignorarlo
        if (err.message.includes('duplicate column name')) {
            console.log('La columna completed ya existe en la tabla reminders.');
        } else {
            console.error('Error al añadir la columna completed:', err);
        }
    } else {
        console.log('Columna completed añadida correctamente a la tabla reminders.');
    }
    
    // Verificar la estructura actualizada
    db.all("PRAGMA table_info(reminders)", [], (err, rows) => {
        if (err) {
            console.error('Error al verificar la estructura de la tabla:', err);
        } else {
            console.log('\nEstructura actualizada de la tabla reminders:');
            console.log(rows);
        }
        
        // Cerrar la conexión cuando terminemos
        db.close();
    });
});
