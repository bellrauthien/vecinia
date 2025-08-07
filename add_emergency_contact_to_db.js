const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vecinia.db');

db.serialize(() => {
  console.log('Adding emergency contact columns to users table...');

  // Add emergency_contact_name column
  db.run("ALTER TABLE users ADD COLUMN emergency_contact_name TEXT", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column emergency_contact_name already exists.');
      } else {
        console.error('Error adding emergency_contact_name column:', err.message);
      }
    } else {
      console.log('Column emergency_contact_name added successfully.');
    }
  });

  // Add emergency_contact_phone column
  db.run("ALTER TABLE users ADD COLUMN emergency_contact_phone TEXT", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column emergency_contact_phone already exists.');
      } else {
        console.error('Error adding emergency_contact_phone column:', err.message);
      }
    } else {
      console.log('Column emergency_contact_phone added successfully.');
    }
  });

  db.close((err) => {
    if (err) {
      console.error('Error closing the database:', err.message);
    }
    console.log('Database connection closed.');
  });
});
