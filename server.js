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
        last_login_date TEXT
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
        userId INTEGER
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
    const sql = 'SELECT id, firstName, lastName, email, profileType, address, phone, skills, availability, province, about_me, birthDate, last_login_date FROM users WHERE id = ?';
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

    const sql = 'SELECT * FROM reminders WHERE userId = ? ORDER BY date, time';
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Endpoint to get a single reminder by ID, including senior's name
app.get('/api/reminders/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT r.*, u.firstName as seniorFirstName, u.lastName as seniorLastName, u.phone as seniorPhone
        FROM reminders r
        JOIN users u ON r.userId = u.id
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
    const sql = 'INSERT INTO reminders (note, type, date, time, address, province, userId, needs_volunteer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [note, type, date, time, address, province, userId, needsVolunteerInt], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, ...req.body });
    });
});

app.get('/api/requests/pending', (req, res) => {
    const { province } = req.query;
    if (!province) {
        return res.status(400).json({ error: 'Province is required' });
    }
    const sql = "SELECT * FROM reminders WHERE province = ? AND status = 'pending' ORDER BY date, time";
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Frontend is served from the same address, e.g., http://localhost:${port}/register.html`);
});
