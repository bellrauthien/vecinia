require('dotenv').config();
const express = require('express');
const path = require('path');
const OpenAI = require('openai');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const port = 3003;

// Check for API key (Temporarily disabled)
/*
if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not set. Please create a .env file and add your API key.');
    process.exit(1);
}
*/

const openai = null; // Temporarily disable OpenAI until API key is provided
/*
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
*/

app.use(express.json());

// Serve auth.html as the default page for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

app.use(express.static(__dirname)); // Serve static files from the root directory

// --- Database Setup ---
const db = new sqlite3.Database('./vecinia.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the vecinia database.');
});

db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        profileType TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        skills TEXT,
        availability TEXT,
        province TEXT,
        about_me TEXT,
        birthDate TEXT,
        last_login_date TEXT,
        rating REAL DEFAULT 0,
        rating_count INTEGER DEFAULT 0
    )`);

    // Reminders table
    db.run(`CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        address TEXT,
        volunteerId INTEGER,
        status TEXT DEFAULT 'pending',
        province TEXT,
        needs_volunteer BOOLEAN DEFAULT 0,
        userId INTEGER,
        completed BOOLEAN DEFAULT 0
    )`);
    
    // Ratings table
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
    )`);
});

// Simple migration to add last_login_date column if it doesn't exist
db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
        console.error("Error checking users table info:", err);
        return;
    }
    const hasColumn = columns.some(column => column.name === 'last_login_date');
    if (!hasColumn) {
        console.log("Adding 'last_login_date' column to 'users' table.");
        db.run("ALTER TABLE users ADD COLUMN last_login_date TEXT", (alterErr) => {
            if (alterErr) {
                console.error("Error adding column:", alterErr);
            }
        });
    }
});


// API endpoint for chat
app.post('/api/chat', async (req, res) => {
    // If OpenAI is disabled, return a placeholder message.
    if (!openai) {
        return res.json({ reply: 'Lo siento, el servicio de chat no está disponible en este momento. La clave de API no ha sido configurada.' });
    }

    try {
        const { message } = req.body;

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un asistente de IA conversacional para personas mayores. Tu tono debe ser siempre cálido, paciente, empático y amigable. Ofrece compañía, responde preguntas con sencillez y ayuda a recordar citas o tareas importantes si te lo piden. Evita la jerga técnica y habla de forma clara y tranquilizadora.'
                },
                {
                    role: 'user',
                    content: message
                }
            ],
        });

        res.json({ reply: completion.choices[0].message.content });

    } catch (error) {
        console.error('Error with OpenAI API:', error);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});

// --- Auth API Endpoints ---
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, profileType, address, phone, birthDate, province } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql = 'INSERT INTO users (firstName, lastName, email, password, profileType, address, phone, birthDate, province) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.run(sql, [firstName, lastName, email, hashedPassword, profileType, address, phone, birthDate, province], function(err) {
            if (err) {
                console.error(err.message);
                // Specific check for UNIQUE constraint violation
                if (err.message.includes('UNIQUE constraint failed: users.email')) {
                    return res.status(400).json({ error: 'Email already exists.' });
                }
                return res.status(500).json({ error: 'Error registering user' });
            }
            res.status(201).json({ id: this.lastID });
        });
    } catch {
        res.status(500).json({ error: 'Error registering user' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging in' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Successful login, update last login date
            const lastLoginDate = new Date().toISOString();
            const updateSql = 'UPDATE users SET last_login_date = ? WHERE id = ?';
            db.run(updateSql, [lastLoginDate, user.id], (updateErr) => {
                if (updateErr) {
                    console.error('Failed to update last login date:', updateErr);
                    // Non-critical error, so we can still proceed with login
                }
                const { password, ...userWithoutPassword } = user;
                res.json({ ...userWithoutPassword, last_login_date: lastLoginDate });
            });
        } else {
            res.status(400).json({ error: 'Invalid credentials.' });
        }
    });
});

// Endpoint to get user profile by ID
app.get('/api/user/profile/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT id, firstName, lastName, email, profileType, address, phone, skills, availability, province, about_me, birthDate, last_login_date, rating, rating_count, emergency_contact_name, emergency_contact_phone FROM users WHERE id = ?';
    db.get(sql, [id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching user profile' });
        }
        if (user) {
            // Ensure skills is always an array for volunteers
            if (user.profileType === 'volunteer' && user.skills) {
                user.skills = user.skills.split(',');
            } else if (user.profileType === 'volunteer' && !user.skills) {
                user.skills = [];
            }
            console.log('Sending user profile data:', user); // Diagnostic log
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});

app.post('/api/user/profile', (req, res) => {
    const { userId, ...profileData } = req.body;

    // If skills are provided as an array, convert them to a comma-separated string
    if (profileData.skills && Array.isArray(profileData.skills)) {
        profileData.skills = profileData.skills.join(',');
    }

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Handle skills array by converting it to a string for DB storage
    if (profileData.skills && Array.isArray(profileData.skills)) {
        profileData.skills = profileData.skills.join(',');
    }

    const fields = Object.keys(profileData);
    const values = Object.values(profileData);

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No data provided to update' });
    }

    // Dynamically build the SET clause for the UPDATE statement
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE users SET ${setClause} WHERE id = ?`;

    db.run(sql, [...values, userId], function(err) {
        if (err) {
            console.error('SQL Error:', err);
            return res.status(500).json({ error: 'Error updating profile' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'Profile updated successfully' });
    });
});

// --- Reminders API Endpoints ---
app.get('/api/reminders', (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('[DEBUG] GET /api/reminders - Fetching reminders for userId:', userId);

    const sql = `
        SELECT r.*, 
               CASE WHEN r.volunteerId IS NOT NULL THEN 
                 (SELECT firstName || ' ' || lastName FROM users WHERE id = r.volunteerId) 
               ELSE NULL END as volunteerName,
               CASE WHEN r.volunteerId IS NOT NULL THEN 
                 (SELECT phone FROM users WHERE id = r.volunteerId) 
               ELSE NULL END as volunteerPhone,
               CASE WHEN r.volunteerId IS NOT NULL THEN 
                 (SELECT rating FROM users WHERE id = r.volunteerId) 
               ELSE NULL END as volunteerRating,
               CASE WHEN r.volunteerId IS NOT NULL THEN 
                 (SELECT rating_count FROM users WHERE id = r.volunteerId) 
               ELSE NULL END as volunteerRatingCount,
               CASE WHEN r.volunteerId IS NOT NULL THEN 'accepted' 
                    WHEN r.needs_volunteer = 1 THEN 'pending' 
                    ELSE 'no_volunteer_needed' END as requestStatus,
               COALESCE(r.completed, 0) as completed
        FROM reminders r
        WHERE r.userId = ? 
        ORDER BY r.date, r.time
    `;
    
    console.log('[DEBUG] SQL query:', sql.replace(/\s+/g, ' ').trim());
    
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error('[DEBUG] Error fetching reminders:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        console.log('[DEBUG] Reminders fetched successfully. Total count:', rows.length);
        
        // Analizar cada recordatorio para depuración
        rows.forEach(row => {
            console.log('[DEBUG] Reminder ID:', row.id, 
                      'Status:', row.status, 
                      'RequestStatus:', row.requestStatus, 
                      'Completed:', row.completed, 
                      'VolunteerId:', row.volunteerId, 
                      'Needs_volunteer:', row.needs_volunteer);
        });
        
        // Contar recordatorios por tipo para depuración
        const pendingCount = rows.filter(r => r.requestStatus === 'pending').length;
        const acceptedCount = rows.filter(r => r.requestStatus === 'accepted').length;
        const completedCount = rows.filter(r => r.completed === 1).length;
        
        console.log('[DEBUG] Counts - Pending:', pendingCount, 'Accepted:', acceptedCount, 'Completed:', completedCount);
        
        res.json(rows);
    });
});

// Endpoint to get a single reminder by ID, including senior's name and volunteer's info if available
app.get('/api/reminders/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT r.*, 
               u.firstName as seniorFirstName, 
               u.lastName as seniorLastName, 
               u.phone as seniorPhone,
               u.rating as seniorRating,
               u.rating_count as seniorRatingCount,
               v.firstName as volunteerFirstName,
               v.lastName as volunteerLastName,
               v.phone as volunteerPhone,
               v.rating as volunteerRating,
               v.rating_count as volunteerRatingCount,
               CASE WHEN r.volunteerId IS NOT NULL THEN 'accepted' 
                    WHEN r.needs_volunteer = 1 THEN 'pending' 
                    ELSE 'no_volunteer_needed' END as requestStatus
        FROM reminders r
        JOIN users u ON r.userId = u.id
        LEFT JOIN users v ON r.volunteerId = v.id
        WHERE r.id = ?
    `;
    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching reminder' });
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Reminder not found' });
        }
    });
});

// Endpoint to update a reminder
app.put('/api/reminders/:id', (req, res) => {
    const { id } = req.params;
    const { note, type, date, time, address = null, province, needs_volunteer } = req.body;

    // Convert boolean to integer for SQLite
    const needsVolunteerInt = needs_volunteer ? 1 : 0;
    const sql = `UPDATE reminders SET 
        note = ?,
        type = ?,
        date = ?,
        time = ?,
        address = ?,
        province = ?,
        needs_volunteer = ?
        WHERE id = ?`;

    db.run(sql, [note, type, date, time, address, province, needsVolunteerInt, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error updating reminder' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        res.json({ message: 'Reminder updated successfully' });
    });
});

app.post('/api/reminders', (req, res) => {
    const { note, type, date, time, address = null, province, userId, needs_volunteer } = req.body; // address is now optional
    const needsVolunteerInt = needs_volunteer ? 1 : 0; // Convert boolean to integer
    
    console.log('[DEBUG] Creating new reminder:', { note, type, date, time, province, userId, needs_volunteer: needsVolunteerInt });
    
    // Verificar los valores por defecto que se establecerán automáticamente
    console.log('[DEBUG] Valores por defecto en la definición de la tabla:');
    console.log('[DEBUG] - status: "pending" (DEFAULT "pending")');
    console.log('[DEBUG] - completed: 0 (DEFAULT 0)');
    console.log('[DEBUG] - volunteerId: null (no tiene valor por defecto)');
    
    // Consulta SQL para obtener los valores por defecto actuales
    db.all("PRAGMA table_info(reminders)", (err, columns) => {
        if (err) {
            console.error('[DEBUG] Error al obtener estructura de tabla:', err);
        } else {
            console.log('[DEBUG] Columnas y valores por defecto:');
            columns.forEach(col => {
                console.log(`[DEBUG] - ${col.name}: ${col.dflt_value || 'NULL'}`);
            });
        }
        
        // Continuar con la inserción normal
        const sql = 'INSERT INTO reminders (note, type, date, time, address, province, userId, needs_volunteer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        console.log('[DEBUG] SQL query:', sql);
        console.log('[DEBUG] SQL params:', [note, type, date, time, address, province, userId, needsVolunteerInt]);
        
        db.run(sql, [note, type, date, time, address, province, userId, needsVolunteerInt], function(err) {
            if (err) {
                console.error('[DEBUG] Error creating reminder:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            console.log('[DEBUG] Reminder created successfully with ID:', this.lastID);
            
            // Obtener el recordatorio recién creado para verificar los valores reales
            db.get('SELECT * FROM reminders WHERE id = ?', [this.lastID], (err, newReminder) => {
                if (err) {
                    console.error('[DEBUG] Error al obtener el recordatorio recién creado:', err);
                } else {
                    console.log('[DEBUG] Recordatorio recién creado con valores reales:');
                    console.log(newReminder);
                }
                
                console.log('[DEBUG] Response payload:', { id: this.lastID, ...req.body });
                res.json({ id: this.lastID, ...req.body });
            });
        });
    });
});

// Endpoint to delete a reminder
app.delete('/api/reminders/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM reminders WHERE id = ?';
    db.run(sql, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error deleting reminder' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        res.json({ message: 'Reminder deleted successfully' });
    });
});

app.get('/api/requests/pending', (req, res) => {
    const { province } = req.query;
    if (!province) {
        return res.status(400).json({ error: 'Province is required' });
    }
    const sql = `
        SELECT r.*, 
               u.firstName as seniorFirstName, 
               u.lastName as seniorLastName,
               u.rating as seniorRating,
               u.rating_count as seniorRatingCount
        FROM reminders r
        JOIN users u ON r.userId = u.id
        WHERE r.province = ? AND r.status = 'pending'
        ORDER BY r.date, r.time
    `;
    db.all(sql, [province], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching requests' });
        }
        res.json(rows);
    });
});

app.get('/api/requests/accepted', (req, res) => {
    const { volunteerId } = req.query;
    if (!volunteerId) {
        return res.status(400).json({ error: 'Volunteer ID is required' });
    }
    const sql = `
        SELECT r.*, u.firstName as seniorFirstName, u.lastName as seniorLastName, u.phone as seniorPhone
        FROM reminders r
        JOIN users u ON r.userId = u.id
        WHERE r.volunteerId = ? AND r.status = 'accepted'
        ORDER BY r.date, r.time
    `;
    db.all(sql, [volunteerId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching accepted requests' });
        }
        res.json(rows);
    });
});

app.get('/api/requests/past', (req, res) => {
    const { volunteerId } = req.query;
    if (!volunteerId) {
        return res.status(400).json({ error: 'Volunteer ID is required' });
    }

    const now = new Date().toISOString();

    const sql = `
        SELECT r.*, u.firstName as seniorFirstName, u.lastName as seniorLastName, u.phone as seniorPhone
        FROM reminders r
        JOIN users u ON r.userId = u.id
        WHERE r.volunteerId = ? AND (r.date || 'T' || r.time) < ?
        ORDER BY r.date DESC, r.time DESC
    `;

    db.all(sql, [volunteerId, now], (err, rows) => {
        if (err) {
            console.error('Error fetching past requests:', err);
            return res.status(500).json({ error: 'Error fetching past requests' });
        }
        res.json(rows);
    });
});

app.post('/api/requests/cancel', (req, res) => {
    const { reminderId } = req.body;
    const sql = "UPDATE reminders SET volunteerId = NULL, status = 'pending' WHERE id = ?";
    db.run(sql, [reminderId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error cancelling request' });
        }
        res.json({ message: 'Request cancelled successfully' });
    });
});

app.post('/api/requests/accept', (req, res) => {
    const { reminderId, volunteerId } = req.body;
    const sql = "UPDATE reminders SET volunteerId = ?, status = 'accepted' WHERE id = ?";
    db.run(sql, [volunteerId, reminderId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error accepting request' });
        }
        res.json({ message: 'Request accepted successfully' });
    });
});

// --- Ratings API Endpoints ---

// Endpoint to mark a reminder as completed
app.post('/api/reminders/:id/complete', (req, res) => {
    const { id } = req.params;
    const sql = "UPDATE reminders SET completed = 1, status = 'completed' WHERE id = ?";
    
    db.run(sql, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error marking reminder as completed' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        res.json({ message: 'Reminder marked as completed successfully' });
    });
});

// Endpoint to submit a rating
app.post('/api/ratings', (req, res) => {
    const { reminderId, raterId, ratedId, score, comment = '' } = req.body;
    
    // Validate score is between 1 and 5
    if (score < 1 || score > 5) {
        return res.status(400).json({ error: 'Score must be between 1 and 5' });
    }
    
    const created_at = new Date().toISOString();
    
    // First check if this user has already rated this reminder
    db.get('SELECT id FROM ratings WHERE reminderId = ? AND raterId = ?', [reminderId, raterId], (err, existingRating) => {
        if (err) {
            return res.status(500).json({ error: 'Error checking existing rating' });
        }
        
        if (existingRating) {
            return res.status(400).json({ error: 'You have already rated this reminder' });
        }
        
        // Insert the new rating
        const sql = 'INSERT INTO ratings (reminderId, raterId, ratedId, score, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)';
        db.run(sql, [reminderId, raterId, ratedId, score, comment, created_at], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error submitting rating' });
            }
            
            // Update the user's average rating
            db.get('SELECT AVG(score) as avgScore, COUNT(id) as count FROM ratings WHERE ratedId = ?', [ratedId], (err, result) => {
                if (err) {
                    console.error('Error calculating average rating:', err);
                    // We still return success for the rating submission
                    return res.json({ id: this.lastID, message: 'Rating submitted successfully' });
                }
                
                const avgScore = result.avgScore || 0;
                const count = result.count || 0;
                
                // Update the user's rating and count
                db.run('UPDATE users SET rating = ?, rating_count = ? WHERE id = ?', [avgScore, count, ratedId], (err) => {
                    if (err) {
                        console.error('Error updating user rating:', err);
                    }
                    
                    res.json({ id: this.lastID, message: 'Rating submitted successfully' });
                });
            });
        });
    });
});

// Endpoint de depuración para examinar la estructura de la tabla de recordatorios
app.get('/api/debug/reminders-structure', (req, res) => {
    console.log('[DEBUG] Examinando estructura de la tabla reminders');
    
    // Obtener información sobre las columnas de la tabla
    db.all("PRAGMA table_info(reminders)", (err, columns) => {
        if (err) {
            console.error('[DEBUG] Error al obtener estructura de tabla:', err);
            return res.status(500).json({ error: 'Error al obtener estructura de tabla' });
        }
        
        console.log('[DEBUG] Estructura de la tabla reminders:');
        console.log(columns);
        
        // Obtener algunos registros de ejemplo
        db.all("SELECT * FROM reminders LIMIT 5", (err, rows) => {
            if (err) {
                console.error('[DEBUG] Error al obtener registros de ejemplo:', err);
                return res.status(500).json({ error: 'Error al obtener registros de ejemplo' });
            }
            
            console.log('[DEBUG] Registros de ejemplo:');
            console.log(rows);
            
            // Devolver toda la información de depuración
            res.json({
                tableStructure: columns,
                sampleRecords: rows
            });
        });
    });
});

// Endpoint to get ratings for a user
app.get('/api/users/:id/ratings', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT r.*, 
               u.firstName as raterFirstName, 
               u.lastName as raterLastName,
               rem.note as reminderNote,
               rem.type as reminderType,
               rem.date as reminderDate
        FROM ratings r
        JOIN users u ON r.raterId = u.id
        JOIN reminders rem ON r.reminderId = rem.id
        WHERE r.ratedId = ?
        ORDER BY r.created_at DESC
    `;
    
    db.all(sql, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching ratings' });
        }
        res.json(rows);
    });
});

// Endpoint to get completed reminders for a user
app.get('/api/reminders/completed', (req, res) => {
    const { userId } = req.query;
    
    console.log('Fetching completed reminders for user ID:', userId);
    
    if (!userId) {
        console.log('Error: User ID is missing');
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    const sql = `
        SELECT r.*, 
               u.firstName as volunteerFirstName, 
               u.lastName as volunteerLastName,
               u.phone as volunteerPhone,
               u.rating as volunteerRating,
               u.rating_count as volunteerRatingCount,
               CASE 
                   WHEN u.firstName IS NOT NULL AND u.lastName IS NOT NULL 
                   THEN u.firstName || ' ' || u.lastName 
                   ELSE NULL 
               END as volunteerName
        FROM reminders r
        LEFT JOIN users u ON r.volunteerId = u.id
        WHERE r.userId = ? AND r.completed = 1
        ORDER BY r.date DESC, r.time DESC
    `;
    
    console.log('Executing SQL query for completed reminders');
    
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching completed reminders:', err);
            return res.status(500).json({ error: 'Error fetching completed reminders' });
        }
        
        console.log('Found completed reminders:', rows.length);
        res.json(rows);
    });
});

// Endpoint to get completed reminders for a volunteer
app.get('/api/volunteer-completed-activities', (req, res) => {
    const { volunteerId } = req.query;
    
    console.log('Fetching completed activities for volunteer ID:', volunteerId);
    
    if (!volunteerId) {
        console.log('Error: Volunteer ID is missing');
        return res.status(400).json({ error: 'Volunteer ID is required' });
    }
    
    const sql = `
        SELECT DISTINCT r.id, r.*, 
               u.firstName as seniorFirstName, 
               u.lastName as seniorLastName,
               u.phone as seniorPhone,
               u.rating as seniorRating,
               u.rating_count as seniorRatingCount
        FROM reminders r
        JOIN users u ON r.userId = u.id
        WHERE r.volunteerId = ? AND r.completed = 1
        ORDER BY r.date DESC, r.time DESC
    `;
    
    console.log('Executing SQL query:', sql);
    console.log('With volunteerId:', volunteerId);
    
    db.all(sql, [volunteerId], (err, rows) => {
        if (err) {
            console.error('Error fetching completed reminders:', err);
            return res.status(500).json({ error: 'Error fetching completed reminders' });
        }
        
        console.log('Found completed activities:', rows.length);
        console.log('First activity (if any):', rows[0] || 'None');
        
        res.json(rows);
    });
});

// Endpoint to check if a user can rate a reminder
app.get('/api/reminders/:id/can-rate', (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get the reminder to check if it's completed and if the user is involved
    db.get('SELECT * FROM reminders WHERE id = ?', [id], (err, reminder) => {
        if (err) {
            return res.status(500).json({ error: 'Error checking reminder' });
        }
        
        if (!reminder) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        
        // Check if the reminder is completed
        if (!reminder.completed) {
            return res.json({ canRate: false, reason: 'Reminder is not completed yet' });
        }
        
        // Check if the user is either the senior or the volunteer
        if (reminder.userId != userId && reminder.volunteerId != userId) {
            return res.json({ canRate: false, reason: 'User is not involved in this reminder' });
        }
        
        // Check if the user has already rated this reminder
        db.get('SELECT id FROM ratings WHERE reminderId = ? AND raterId = ?', [id, userId], (err, rating) => {
            if (err) {
                return res.status(500).json({ error: 'Error checking existing rating' });
            }
            
            if (rating) {
                return res.json({ canRate: false, hasRated: true, reason: 'User has already rated this reminder' });
            }
            
            // Determine who the user would be rating
            const ratedId = reminder.userId == userId ? reminder.volunteerId : reminder.userId;
            
            res.json({ 
                canRate: true, 
                ratedId: ratedId,
                userRole: reminder.userId == userId ? 'senior' : 'volunteer'
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Frontend is served from the same address, e.g., http://localhost:${port}/register.html`);
});
