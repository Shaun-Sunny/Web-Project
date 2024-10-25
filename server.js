// Required modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Initialize the app
const app = express();
app.use(bodyParser.json());

// Use session middleware
app.use(session({
    secret: 'your_secret_key', // Replace with a secure secret in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to `true` if using HTTPS
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/user', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

// Define the user schema and model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Function to get the user-specific collection for diary entries
const getUserDiaryCollection = (user_id) => {
    return mongoose.connection.collection(`diary_${user_id}`); // Collection named 'diary_userId'
};

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
    if (req.session && req.session.user_id) {
        next(); // User is logged in, proceed to the next step
    } else {
        res.status(401).json({ error: 'Unauthorized: Please log in first' });
    }
};

// API route to handle user signup
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ email, password: hashedPassword });
        const savedUser = await newUser.save();

        // Ensure a collection is created for the new user
        getUserDiaryCollection(savedUser._id); // Initializes the collection

        res.status(201).json({ message: 'User created successfully and diary collection initialized!' });
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).json({ error: 'User already exists or other error' });
    }
});

// API route to handle user login (with session management)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Save the user ID in the session
        req.session.user_id = user._id;
        res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API route to save a diary entry for the logged-in user
app.post('/save-diary-entry', ensureAuthenticated, async (req, res) => {
    const { title, content } = req.body;
    const user_id = req.session.user_id; // Get the user ID from the session

    try {
        // Get the user-specific collection
        const userDiaryCollection = getUserDiaryCollection(user_id);

        // Save the diary entry in the user-specific collection
        await userDiaryCollection.insertOne({
            title,
            content,
            created_at: new Date(),
        });

        res.status(200).json({ message: 'Diary entry saved successfully!' });
    } catch (error) {
        console.error('Error saving diary entry:', error);
        res.status(500).json({ error: 'Failed to save diary entry' });
    }
});

// Route to fetch diary entries for the logged-in user
app.get('/get-diary-entries', ensureAuthenticated, async (req, res) => {
    const user_id = req.session.user_id;

    try {
        const userDiaryCollection = getUserDiaryCollection(user_id);
        const diaryEntries = await userDiaryCollection.find({}, { projection: { title: 1, created_at: 1 } }).toArray();

        res.status(200).json({ entries: diaryEntries });
    } catch (error) {
        console.error('Error fetching diary entries:', error);
        res.status(500).json({ error: 'Failed to fetch diary entries' });
    }
});

// API route to view a specific diary entry
app.get('/view-diary-entry/:id', ensureAuthenticated, async (req, res) => {
    const user_id = req.session.user_id;
    const entry_id = new mongoose.Types.ObjectId(req.params.id);

    try {
        const userDiaryCollection = getUserDiaryCollection(user_id);
        const entry = await userDiaryCollection.findOne({ _id: entry_id });

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        res.status(200).json(entry);
    } catch (error) {
        console.error('Error viewing diary entry:', error);
        res.status(500).json({ error: 'Failed to view diary entry' });
    }
});

// API route to edit a specific diary entry
app.put('/edit-diary-entry/:id', ensureAuthenticated, async (req, res) => {
    const user_id = req.session.user_id;
    const entry_id = new mongoose.Types.ObjectId(req.params.id);
    const { title, content } = req.body;

    try {
        const userDiaryCollection = getUserDiaryCollection(user_id);
        await userDiaryCollection.updateOne(
            { _id: entry_id },
            { $set: { title, content, updated_at: new Date() } }
        );

        res.status(200).json({ message: 'Diary entry updated successfully!' });
    } catch (error) {
        console.error('Error editing diary entry:', error);
        res.status(500).json({ error: 'Failed to edit diary entry' });
    }
});

// API route to delete a specific diary entry
app.delete('/delete-diary-entry/:id', ensureAuthenticated, async (req, res) => {
    const user_id = req.session.user_id;
    const entry_id = new mongoose.Types.ObjectId(req.params.id);

    try {
        const userDiaryCollection = getUserDiaryCollection(user_id);
        await userDiaryCollection.deleteOne({ _id: entry_id });

        res.status(200).json({ message: 'Diary entry deleted successfully!' });
    } catch (error) {
        console.error('Error deleting diary entry:', error);
        res.status(500).json({ error: 'Failed to delete diary entry' });
    }
});

// Serve the frontend HTML form
app.use(express.static('public'));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});















