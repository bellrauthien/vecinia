const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vecinia.db');

console.log('Starting database cleanup...');

// Begin transaction
db.serialize(() => {
    db.run('BEGIN TRANSACTION;');
    
    // Delete all records from ratings table
    db.run('DELETE FROM ratings;', function(err) {
        if (err) {
            console.error('Error deleting ratings:', err.message);
            db.run('ROLLBACK;');
            return;
        }
        console.log(`Deleted ${this.changes} ratings`);
    });
    
    // Delete all records from reminders table
    db.run('DELETE FROM reminders;', function(err) {
        if (err) {
            console.error('Error deleting reminders:', err.message);
            db.run('ROLLBACK;');
            return;
        }
        console.log(`Deleted ${this.changes} reminders`);
    });
    
    // Reset the autoincrement counters
    db.run('DELETE FROM sqlite_sequence WHERE name="ratings" OR name="reminders";', function(err) {
        if (err) {
            console.error('Error resetting autoincrement:', err.message);
            db.run('ROLLBACK;');
            return;
        }
        console.log('Reset autoincrement counters');
    });
    
    // Commit the transaction
    db.run('COMMIT;', function(err) {
        if (err) {
            console.error('Error committing transaction:', err.message);
            db.run('ROLLBACK;');
            return;
        }
        console.log('Database cleanup completed successfully!');
        
        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
        });
    });
});
