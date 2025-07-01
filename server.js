require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const axios = require('axios'); // Add this at the top with other requires

const app = express();

// Middleware
app.use(cors({
  origin: ['https://designx-solutions.co.za', 'https://www.designx-solutions.co.za']
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
app.post('/send-email', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !service || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Email to business
    const businessMailOptions = {
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

    // Email to client
    const clientMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Thank you for contacting DesignX!`,
      html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4BB543; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Thank You, ${name}!</h1>
        </div>
        
        <div style="padding: 25px; background-color: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6; color: #444;">
            We've received your inquiry about our <strong>${service}</strong> service and we're excited to work with you!
          </p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0; margin: 20px 0;">
            <h3 style="color: #4BB543; margin-top: 0;">Here's what happens next:</h3>
            <ol style="padding-left: 20px; color: #444;">
              <li style="margin-bottom: 8px;">Our team will review your request within 24 hours</li>
              <li style="margin-bottom: 8px;">We'll contact you at ${email} ${phone ? `or ${phone}` : ''} to discuss your project</li>
              <li>We'll provide a detailed proposal and answer any questions you have</li>
            </ol>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #444;">
            In the meantime, feel free to reply to this email if you have any additional questions or information to share.
          </p>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="mailto:${process.env.EMAIL_USER}" style="display: inline-block; background-color: #4BB543; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Contact Us</a>
          </div>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>This is an automated confirmation of your inquiry submitted at ${new Date().toLocaleString()}</p>
          <p>© ${new Date().getFullYear()} DesignX. All rights reserved.</p>
        </div>
      </div>
      `
    };

    // Send both emails
    const businessEmailPromise = new Promise((resolve, reject) => {
      transporter.sendMail(businessMailOptions, (error, info) => {
        if (error) reject(error);
        else resolve(info);
      });
    });

    const clientEmailPromise = new Promise((resolve, reject) => {
      transporter.sendMail(clientMailOptions, (error, info) => {
        if (error) reject(error);
        else resolve(info);
      });
    });

    // Wait for both emails to be sent
    const [businessResult, clientResult] = await Promise.all([
      businessEmailPromise,
      clientEmailPromise
    ]);

    console.log('Business email sent:', businessResult.response);
    console.log('Client email sent:', clientResult.response);

    res.json({
      success: true,
      message: 'Emails sent successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Only change needed: This line already works for both Vercel and local
const PORT = process.env.PORT || 3001; 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Keep-alive (updated for Vercel)
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      axios.get(process.env.VERCEL_URL || `http://localhost:${PORT}`)
        .catch(err => console.log('Keep-alive ping:', err.message));
    }, 14 * 60 * 1000); // 14 minutes
  }
});
