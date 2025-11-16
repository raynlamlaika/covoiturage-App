const express = require('express');
const fs = require('fs').promises; // Use promises for async file operations
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3001; // We'll run the backend on a different port
const DB_PATH = './db.json';

// --- Middleware ---
// Allow requests from our frontend
app.use(cors({ origin: 'http://localhost:3000' }));
// Allow server to read JSON from request bodies
app.use(express.json());

// --- Helper Functions ---
// Read the database
const readDB = async () => {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    // If file doesn't exist or is empty, return a default structure
    return { users: [] };
  }
};

// Write to the database
const writeDB = async (data) => {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing to database:", error);
  }
};

// --- API Routes ---

/**
 * REGISTER (Sign-in)
 * POST /register
 */
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const db = await readDB();

    // Check if user already exists
    const userExists = db.users.find(user => user.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Add new user
    const newUser = { id: Date.now().toString(), email, password: hashedPassword };
    db.users.push(newUser);
    await writeDB(db);

    console.log('User registered:', newUser.email);
    res.status(201).json({ message: 'User registered successfully!' });

  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

/**
 * LOGIN (Log-in)
 * POST /login
 */
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const db = await readDB();

    // Find the user
    const user = db.users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Check the password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // ---
    // SUCCESS! In a real app, you would send a JWT (JSON Web Token) here.
    // For this example, we'll just send a success message.
    // ---
    console.log('User logged in:', user.email);
    res.status(200).json({ message: 'Login successful!' });

  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});