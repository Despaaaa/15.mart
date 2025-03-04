const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 