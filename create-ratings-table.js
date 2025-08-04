const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vecinia.db');

console.log('Creando la tabla ratings...');

// Crear la tabla ratings si no existe
db.run(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reminderId INTEGER NOT NULL,
    raterId INTEGER NOT NULL,
    ratedId INTEGER NOT NULL,
    score INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (reminderId) REFERENCES reminders(id),
    FOREIGN KEY (raterId) REFERENCES users(id),
    FOREIGN KEY (ratedId) REFERENCES users(id)
)`, (err) => {
    if (err) {
        console.error('Error al crear la tabla ratings:', err);
    } else {
        console.log('Tabla ratings creada correctamente o ya existía.');
    }
    
    // Verificar la estructura de la tabla
    db.all("PRAGMA table_info(ratings)", [], (err, rows) => {
        if (err) {
            console.error('Error al verificar la estructura de la tabla:', err);
        } else {
            console.log('\nEstructura de la tabla ratings:');
            console.log(rows);
        }
        
        // Cerrar la conexión cuando terminemos
        db.close();
    });
});
