require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: 'https://designx-solutions.netlify.app/' // Replace with your Netlify URL
}));
app.use(express.json());

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Email endpoint
// Add this validation middleware before your email endpoint
app.use('/send-email', (req, res, next) => {
  const { name, email, phone, service, message } = req.body;
  
  // Basic validation
  if (!name || !email || !service || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }
  
  // Validate email format
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }
  
  // Validate South African phone number if provided
  if (phone && !/^(\+27|0)[6-8][0-9]{8}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid South African phone number'
    });
  }
  
  // Basic spam check - reject messages with URLs
  if (/(http|https|www\.|\.[a-z]{2,})/i.test(message)) {
    return res.status(400).json({
      success: false,
      error: 'Messages containing links are not allowed'
    });
  }
  
  next();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
