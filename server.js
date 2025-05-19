require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: 'https://your-netlify-site.netlify.app' // Replace with your Netlify URL
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
app.post('/send-email', (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !service || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Inquiry: ${service} - ${name}`,
      html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4BB543; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Client Inquiry</h1>
        </div>
        
        <div style="padding: 25px; background-color: #f9f9f9;">
          <h2 style="color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">${service} Package</h2>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #4BB543; margin-bottom: 5px;">Client Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; width: 30%; color: #666;">Name:</td>
                <td style="padding: 8px 0; font-weight: 500;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #4BB543; text-decoration: none;">${email}</a></td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Phone:</td>
                <td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #4BB543; text-decoration: none;">${phone}</a></td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="margin-bottom: 20px; background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0;">
            <h3 style="color: #4BB543; margin-top: 0;">Message Details</h3>
            <p style="white-space: pre-line; line-height: 1.6; color: #444;">${message}</p>
          </div>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="mailto:${email}" style="display: inline-block; background-color: #4BB543; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reply to Client</a>
          </div>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>This email was sent from your website contact form. Received at ${new Date().toLocaleString()}</p>
          <p>© ${new Date().getFullYear()} DesignX. All rights reserved.</p>
        </div>
      </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email send error:', error);
        return res.status(500).json({
          success: false,
          error: 'Error sending email'
        });
      }
      console.log('Email sent:', info.response);
      res.json({
        success: true,
        message: 'Email sent successfully'
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});