const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vecinia.db');

console.log('Actualizando la estructura de la tabla users...');

// Añadir la columna rating a la tabla users si no existe
db.run("ALTER TABLE users ADD COLUMN rating REAL DEFAULT 0", (err) => {
    if (err) {
        // Si el error es porque la columna ya existe, ignorarlo
        if (err.message.includes('duplicate column name')) {
            console.log('La columna rating ya existe en la tabla users.');
        } else {
            console.error('Error al añadir la columna rating:', err);
        }
    } else {
        console.log('Columna rating añadida correctamente a la tabla users.');
    }
    
    // Añadir la columna rating_count a la tabla users
    db.run("ALTER TABLE users ADD COLUMN rating_count INTEGER DEFAULT 0", (err) => {
        if (err) {
            // Si el error es porque la columna ya existe, ignorarlo
            if (err.message.includes('duplicate column name')) {
                console.log('La columna rating_count ya existe en la tabla users.');
            } else {
                console.error('Error al añadir la columna rating_count:', err);
            }
        } else {
            console.log('Columna rating_count añadida correctamente a la tabla users.');
        }
        
        // Verificar la estructura actualizada
        db.all("PRAGMA table_info(users)", [], (err, rows) => {
            if (err) {
                console.error('Error al verificar la estructura de la tabla:', err);
            } else {
                console.log('\nEstructura actualizada de la tabla users:');
                console.log(rows);
            }
            
            // Cerrar la conexión cuando terminemos
            db.close();
        });
    });
});
