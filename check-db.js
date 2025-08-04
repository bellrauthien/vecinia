const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vecinia.db');

// Verificar la estructura de la tabla reminders
db.all("PRAGMA table_info(reminders)", [], (err, rows) => {
    if (err) {
        console.error('Error al verificar la estructura de la tabla:', err);
        return;
    }
    console.log('Estructura de la tabla reminders:');
    console.log(rows);
});

// Verificar algunos registros de la tabla reminders
db.all("SELECT * FROM reminders LIMIT 5", [], (err, rows) => {
    if (err) {
        console.error('Error al obtener registros:', err);
        return;
    }
    console.log('\nRegistros de ejemplo de la tabla reminders:');
    console.log(JSON.stringify(rows, null, 2));
});

// Cerrar la conexión cuando terminemos
setTimeout(() => {
    db.close();
}, 1000);
