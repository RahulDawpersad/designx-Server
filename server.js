require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// ======================
// Server Configuration
// ======================
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  'https://designx-solutions.co.za',
  'https://www.designx-solutions.co.za'
];

// ======================
// Middleware
// ======================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});
app.use('/send-email', limiter);

// ======================
// Email Configuration
// ======================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ======================
// Helper Functions
// ======================
function buildBusinessEmail(data) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <!-- Your email HTML template -->
  </div>
  `;
}

function buildClientEmail(data) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <!-- Your email HTML template -->
  </div>
  `;
}

// ======================
// Routes
// ======================
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.post('/send-email', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    // Input validation
    if (!name || !email || !service || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Send business email
    const businessInfo = await transporter.sendMail({
      from: `"DesignX Solutions" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Inquiry: ${service} - ${name}`,
      html: buildBusinessEmail({ name, email, phone, service, message }),
      text: `New inquiry from ${name} (${email}) about ${service}`
    });

    // Send client confirmation
    const clientInfo = await transporter.sendMail({
      from: `"DesignX Solutions" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thank you for contacting DesignX Solutions!',
      html: buildClientEmail({ name, email, phone, service, message }),
      text: `Thank you ${name} for your inquiry about ${service}`
    });

    res.status(200).json({
      success: true,
      message: 'Emails sent successfully',
      data: {
        businessId: businessInfo.messageId,
        clientId: clientInfo.messageId
      }
    });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ======================
// Error Handling
// ======================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy blocked this request'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ======================
// Server Start
// ======================
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});

// ======================
// Vercel Keep-Alive
// ======================
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    require('axios').get(process.env.VERCEL_URL || `http://localhost:${PORT}`)
      .catch(err => console.log('Keep-alive ping:', err.message));
  }, 14 * 60 * 1000); // 14 minutes
}
