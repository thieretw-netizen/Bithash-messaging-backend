const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const crypto = require('crypto');
const path = require('path');
const xlsx = require('xlsx');
require('dotenv').config();

const app = express();

// ======================
// CORS Configuration
// ======================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://citation-training-academy.vercel.app',
      'https://bithash-messaging-backend-o294.onrender.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://citation-training-academy-1b8h.vercel.app',
      'https://www.bithashcapital.live'
    ];
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ======================
// Security Middleware
// ======================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// ======================
// Rate Limiting
// ======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { status: 'error', message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// ======================
// Body Parsing Middleware
// ======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================
// JWT Configuration
// ======================
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ======================
// MongoDB Connection
// ======================
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mekitariansalinacoria8_db_user:PTd4blzgRclmyuV8@cluster0.fvvirw2.mongodb.net/?appName=Cluster0')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ======================
// Email Configuration - Using only info transporter
// ======================
const infoTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_INFO_USER,
    pass: process.env.EMAIL_INFO_PASS
  },
  tls: { rejectUnauthorized: false },
  pool: true,
  maxConnections: 5,
  maxMessages: 100
});

const transporter = infoTransporter;

transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server ready. Sender: info@bithashcapital.live');
  }
});

// ======================
// PROFESSIONAL EMAIL TEMPLATE - COMPLETE FOOTER WITH DISCLAIMER
// ======================
const createProfessionalEmail = (subject, bodyContent, trackingPixel = null) => {
  const date = new Date();
  const formattedDate = date.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
  });

  const contentWithTracking = trackingPixel
    ? `${bodyContent}<img src="${trackingPixel}" width="1" height="1" alt="" style="display:none;">`
    : bodyContent;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} | ₿itHash Capital</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F1F5F9;
      margin: 0;
      padding: 20px 0;
      line-height: 1.5;
    }
    .email-container {
      max-width: 600px;
      width: 100%;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01);
    }
    /* HEADER SECTION */
    .email-header {
      text-align: center;
      padding: 32px 24px 24px 24px;
      background: linear-gradient(135deg, #0B0E11 0%, #11151C 100%);
    }
    .email-logo {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      display: inline-block;
    }
    .email-logo img {
      width: 100%;
      height: auto;
    }
    .email-title {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      letter-spacing: 0.5px;
    }
    .email-tagline {
      color: #B7BDC6;
      font-size: 14px;
      margin: 0;
      font-style: italic;
    }
    /* BODY SECTION */
    .email-body {
      padding: 32px 28px;
      background-color: #FFFFFF;
      color: #1E293B;
    }
    /* FOOTER SECTION - COMPLETE WITH DISCLAIMER */
    .email-footer {
      text-align: center;
      padding: 28px 24px;
      background-color: #0B0E11;
      border-top: 1px solid #1E2329;
    }
    .footer-disclaimer {
      color: #6C7480;
      font-size: 11px;
      line-height: 1.5;
      margin: 0 0 16px 0;
      padding-bottom: 16px;
      border-bottom: 1px solid #1E2329;
    }
    .footer-copyright {
      color: #6C7480;
      font-size: 12px;
      margin: 0 0 8px 0;
    }
    .footer-address {
      color: #6C7480;
      font-size: 11px;
      margin: 0 0 12px 0;
    }
    .footer-links {
      margin-top: 8px;
    }
    .footer-links a {
      color: #F7A600;
      text-decoration: none;
      font-size: 12px;
      margin: 0 8px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    .footer-separator {
      color: #6C7480;
      font-size: 12px;
    }
    .email-timestamp {
      color: #94A3B8;
      font-size: 10px;
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #E2E8F0;
    }
    @media only screen and (max-width: 600px) {
      body { padding: 10px 0; }
      .email-body { padding: 24px 20px; }
      .email-header { padding: 24px 20px; }
      .email-title { font-size: 24px; }
      .footer-links a { display: inline-block; margin: 4px 6px; }
      .footer-disclaimer { font-size: 10px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- HEADER SECTION -->
    <div class="email-header">
      <div class="email-logo">
        <img src="https://media.bithashcapital.live/ChatGPT%20Image%20Mar%2029%2C%202026%2C%2004_52_02%20PM.png" alt="₿itHash Capital Logo">
      </div>
      <h1 class="email-title">₿itHash</h1>
      <p class="email-tagline"><i>Where Your Financial Goals Become Reality</i></p>
    </div>
    
    <!-- BODY SECTION - Admin content goes here -->
    <div class="email-body">
      ${contentWithTracking}
    </div>
    
    <!-- FOOTER SECTION - COMPLETE WITH LEGAL DISCLAIMER -->
    <div class="email-footer">
      <p class="footer-disclaimer">
        This material is for informational purposes only and does not constitute investment advice. 
        Cryptocurrency markets involve substantial risk.
      </p>
      <p class="footer-copyright">© ${new Date().getFullYear()} Bithash Capital — All rights reserved.</p>
      <p class="footer-address">800 Plant St, Wilmington, DE 19801, United States</p>
      <div class="footer-links">
        <a href="https://www.bithashcapital.live/unsubscribe">Unsubscribe</a>
        <span class="footer-separator">|</span>
        <a href="https://www.bithashcapital.live/privacy">Privacy policy</a>
        <span class="footer-separator">|</span>
        <a href="mailto:support@bithashcapital.live">support@bithashcapital.live</a>
      </div>
    </div>
  </div>
  <div class="email-timestamp">
    This email was sent on ${formattedDate}
  </div>
</body>
</html>`;
};

// ======================
// Database Schemas
// ======================

const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 50 },
  password: { type: String, required: true, minlength: 6 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, default: 'admin', enum: ['admin', 'superadmin'] },
  lastLogin: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

adminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const investorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, validate: [validator.isEmail, 'Please provide a valid email'] },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, trim: true },
  country: { type: String, trim: true },
  joinDate: { type: Date, default: Date.now },
  tier: { type: String, default: 'Standard', enum: ['Standard', 'Premium', 'VIP'] },
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'new'] },
  totalInvested: { type: Number, default: 0 },
  lastContact: Date,
  notes: String,
  tags: [String]
}, { timestamps: true });

const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  category: { type: String, default: 'general', enum: ['general', 'promotional', 'update', 'alert'] },
  isActive: { type: Boolean, default: true },
  usedCount: { type: Number, default: 0 },
  lastUsed: Date
}, { timestamps: true });

const emailCampaignSchema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  recipients: [{
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
    email: String,
    name: String,
    status: { type: String, default: 'sent', enum: ['sent', 'delivered', 'opened', 'failed'] },
    openedAt: Date,
    error: String
  }],
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  sentAt: { type: Date, default: Date.now },
  scheduledFor: Date,
  enableTracking: { type: Boolean, default: true },
  openCount: { type: Number, default: 0 },
  status: { type: String, default: 'draft', enum: ['draft', 'scheduled', 'sent', 'failed'] },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
  metadata: { ipAddress: String, userAgent: String }
}, { timestamps: true });

const trackingPixelSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  openedAt: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

const AdminUser = mongoose.model('AdminUser', adminUserSchema);
const Investor = mongoose.model('Investor', investorSchema);
const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema);
const TrackingPixel = mongoose.model('TrackingPixel', trackingPixelSchema);

// ======================
// Authentication Middleware
// ======================
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ status: 'error', message: 'Access token required' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await AdminUser.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ status: 'error', message: 'User not found or inactive' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ status: 'error', message: 'Invalid or expired token' });
  }
};

// ======================
// API Routes
// ======================

app.get('/health', (req, res) => {
  res.json({ status: 'success', message: 'Server is running smoothly', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ status: 'error', message: 'Username and password are required' });
    const user = await AdminUser.findOne({ username, isActive: true });
    if (!user) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    user.lastLogin = new Date();
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ status: 'success', message: 'Login successful', token, user: { id: user._id, username: user.username, name: user.name, role: user.role, lastLogin: user.lastLogin } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error during login' });
  }
});

app.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    const totalInvestors = await Investor.countDocuments({ status: 'active' });
    const emailsSent = await EmailCampaign.countDocuments({ status: 'sent' });
    const emailCampaigns = await EmailCampaign.find({ status: 'sent' });
    let totalRecipients = 0, totalOpens = 0;
    emailCampaigns.forEach(campaign => {
      totalRecipients += campaign.recipients.length;
      totalOpens += campaign.openCount;
    });
    const openRate = totalRecipients > 0 ? (totalOpens / totalRecipients * 100).toFixed(1) : 0;
    res.json({ status: 'success', data: { totalInvestors, emailsSent, openRate: parseFloat(openRate), lastActivity: new Date().toISOString(), investorTrend: 2.5, emailTrend: 1.8, openTrend: -0.5, activityTime: 'Just now' } });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load statistics' });
  }
});

app.get('/admin/investors', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const filter = req.query.filter || '';
    let query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (filter && filter !== 'all') query.status = filter;
    const investors = await Investor.find(query).sort({ joinDate: -1 }).skip(skip).limit(limit).select('-__v');
    const totalCount = await Investor.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    res.json({ status: 'success', data: { investors, totalCount, totalPages, currentPage: page } });
  } catch (error) {
    console.error('Investors error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load investors' });
  }
});

app.get('/admin/investors/all', authenticateToken, async (req, res) => {
  try {
    const investors = await Investor.find({ status: 'active' }).select('name email').sort({ name: 1 });
    res.json({ status: 'success', data: investors });
  } catch (error) {
    console.error('Get all investors error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load investors' });
  }
});

app.post('/admin/send-email', authenticateToken, async (req, res) => {
  try {
    const { recipients, subject, content, enableTracking = true, scheduleEmail = false, scheduleDate = null, saveAsTemplate = false, templateName = null, templateId = null } = req.body;
    if (!subject || !content) return res.status(400).json({ status: 'error', message: 'Subject and content are required' });
    let recipientInvestors = [];
    if (Array.isArray(recipients) && recipients.length > 0) {
      if (typeof recipients[0] === 'string' && recipients[0].includes('@')) {
        recipientInvestors = recipients.map(email => ({ email, name: email }));
      } else {
        recipientInvestors = await Investor.find({ _id: { $in: recipients }, status: 'active' });
      }
    } else {
      recipientInvestors = await Investor.find({ status: 'active' });
    }
    if (recipientInvestors.length === 0) return res.status(400).json({ status: 'error', message: 'No valid recipients found' });
    const campaign = new EmailCampaign({
      subject, content,
      recipients: recipientInvestors.map(inv => ({ investorId: inv._id || null, email: inv.email, name: inv.name || inv.email, status: 'sent' })),
      sentBy: req.user._id, enableTracking, status: scheduleEmail ? 'scheduled' : 'sent',
      scheduledFor: scheduleEmail ? new Date(scheduleDate) : null, templateId: templateId || null
    });
    await campaign.save();
    if (saveAsTemplate && templateName) {
      const template = new EmailTemplate({ name: templateName, subject, content, category: 'general' });
      await template.save();
    }
    if (!scheduleEmail) await sendEmailCampaign(campaign);
    res.json({ status: 'success', message: `Email campaign created successfully. ${recipientInvestors.length} recipients.`, data: { campaignId: campaign._id, recipientCount: recipientInvestors.length, scheduled: scheduleEmail } });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send email campaign' });
  }
});

app.post('/admin/send-bulk-email', authenticateToken, async (req, res) => {
  try {
    const { excelData, subject, content, enableTracking = true } = req.body;
    if (!subject || !content) return res.status(400).json({ status: 'error', message: 'Subject and content are required' });
    if (!excelData || !Array.isArray(excelData)) return res.status(400).json({ status: 'error', message: 'Valid Excel data is required' });
    const emails = [];
    excelData.forEach(row => {
      for (let key in row) {
        if (validator.isEmail(String(row[key]))) {
          emails.push(String(row[key]));
          break;
        }
      }
    });
    if (emails.length === 0) return res.status(400).json({ status: 'error', message: 'No valid email addresses found in the Excel file' });
    const recipientInvestors = emails.map(email => ({ email, name: email }));
    const campaign = new EmailCampaign({
      subject, content,
      recipients: recipientInvestors.map(inv => ({ email: inv.email, name: inv.name || inv.email, status: 'sent' })),
      sentBy: req.user._id, enableTracking, status: 'sent'
    });
    await campaign.save();
    await sendEmailCampaign(campaign);
    res.json({ status: 'success', message: `Bulk email campaign created successfully. ${recipientInvestors.length} recipients.`, data: { campaignId: campaign._id, recipientCount: recipientInvestors.length } });
  } catch (error) {
    console.error('Send bulk email error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send bulk email campaign' });
  }
});

app.get('/admin/emails', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const filter = req.query.filter || '';
    let query = {};
    if (search) query.subject = { $regex: search, $options: 'i' };
    if (filter && filter !== 'all') query.status = filter;
    const emails = await EmailCampaign.find(query).populate('sentBy', 'name username').sort({ sentAt: -1 }).skip(skip).limit(limit).select('-content -recipients');
    const totalCount = await EmailCampaign.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    const emailsWithStats = emails.map(email => ({
      id: email._id, subject: email.subject, recipientCount: email.recipients ? email.recipients.length : 0,
      sentDate: email.sentAt, openRate: email.recipients && email.recipients.length > 0 ? ((email.openCount / email.recipients.length) * 100).toFixed(1) : 0,
      status: email.status, sentBy: email.sentBy?.name || 'System'
    }));
    res.json({ status: 'success', data: { emails: emailsWithStats, totalCount, totalPages, currentPage: page } });
  } catch (error) {
    console.error('Email history error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load email history' });
  }
});

app.get('/admin/templates', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    let query = { isActive: true };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { subject: { $regex: search, $options: 'i' } }];
    const templates = await EmailTemplate.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit);
    const totalCount = await EmailTemplate.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    res.json({ status: 'success', data: { templates, totalCount, totalPages, currentPage: page } });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load templates' });
  }
});

app.get('/admin/templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findById(id);
    if (!template) return res.status(404).json({ status: 'error', message: 'Template not found' });
    res.json({ status: 'success', data: { template } });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load template' });
  }
});

app.post('/admin/templates', authenticateToken, async (req, res) => {
  try {
    const { name, subject, content, category = 'general' } = req.body;
    if (!name || !subject || !content) return res.status(400).json({ status: 'error', message: 'Name, subject, and content are required' });
    const template = new EmailTemplate({ name, subject, content, category });
    await template.save();
    res.json({ status: 'success', message: 'Template saved successfully', data: { template } });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create template' });
  }
});

app.put('/admin/templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, content, category } = req.body;
    const template = await EmailTemplate.findByIdAndUpdate(id, { name, subject, content, category, lastUsed: new Date() }, { new: true, runValidators: true });
    if (!template) return res.status(404).json({ status: 'error', message: 'Template not found' });
    res.json({ status: 'success', message: 'Template updated successfully', data: { template } });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update template' });
  }
});

app.delete('/admin/templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!template) return res.status(404).json({ status: 'error', message: 'Template not found' });
    res.json({ status: 'success', message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete template' });
  }
});

app.get('/admin/analytics', authenticateToken, async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    const campaigns = await EmailCampaign.find({ sentAt: { $gte: startDate }, status: 'sent' });
    let totalSent = 0, totalDelivered = 0, totalOpened = 0;
    campaigns.forEach(campaign => {
      totalSent += campaign.recipients.length;
      totalOpened += campaign.openCount;
      totalDelivered += campaign.recipients.length;
    });
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent * 100).toFixed(1) : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered * 100).toFixed(1) : 0;
    res.json({ status: 'success', data: { deliveryRate: parseFloat(deliveryRate), openRate: parseFloat(openRate), clickRate: 0, unsubscribeRate: 0, deliveryTrend: 0.2, openTrend: -0.3, clickTrend: 0.1, unsubscribeTrend: -0.1 } });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load analytics' });
  }
});

app.get('/track/:campaignId/:recipientId', async (req, res) => {
  try {
    const { campaignId, recipientId } = req.params;
    const trackingPixel = new TrackingPixel({ campaignId, recipientId, ipAddress: req.ip, userAgent: req.get('User-Agent') });
    await trackingPixel.save();
    await EmailCampaign.findByIdAndUpdate(campaignId, { $inc: { openCount: 1 } });
    await EmailCampaign.updateOne({ _id: campaignId, 'recipients._id': recipientId }, { $set: { 'recipients.$.status': 'opened', 'recipients.$.openedAt': new Date() } });
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': pixel.length, 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' });
    res.end(pixel);
  } catch (error) {
    console.error('Tracking pixel error:', error);
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.type('gif').send(pixel);
  }
});

app.get('/admin/export/investors', authenticateToken, async (req, res) => {
  try {
    const investors = await Investor.find({}).sort({ joinDate: -1 }).select('name email phone country joinDate tier status totalInvested');
    const csvHeader = 'Name,Email,Phone,Country,Join Date,Tier,Status,Total Invested\n';
    const csvRows = investors.map(inv => `"${inv.name}","${inv.email}","${inv.phone || ''}","${inv.country || ''}","${new Date(inv.joinDate).toISOString().split('T')[0]}","${inv.tier}","${inv.status}",${inv.totalInvested}`).join('\n');
    const csv = csvHeader + csvRows;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=investors.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export investors error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to export investors' });
  }
});

app.get('/admin/export/emails', authenticateToken, async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find({ status: 'sent' }).populate('sentBy', 'name').sort({ sentAt: -1 }).select('subject sentAt openCount recipients');
    const csvHeader = 'Subject,Sent Date,Recipients,Open Rate,Sent By\n';
    const csvRows = campaigns.map(campaign => {
      const openRate = campaign.recipients && campaign.recipients.length > 0 ? ((campaign.openCount / campaign.recipients.length) * 100).toFixed(1) : 0;
      return `"${campaign.subject}","${new Date(campaign.sentAt).toISOString()}",${campaign.recipients ? campaign.recipients.length : 0},${openRate}%,"${campaign.sentBy?.name || 'System'}"`;
    }).join('\n');
    const csv = csvHeader + csvRows;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=email-history.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export emails error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to export email history' });
  }
});

// ======================
// Send Email Campaign Helper
// ======================
async function sendEmailCampaign(campaign) {
  console.log(`Starting email campaign: ${campaign._id}`);
  console.log(`Recipients: ${campaign.recipients.length}`);
  console.log(`Sender: info@bithashcapital.live`);

  try {
    let successCount = 0, failCount = 0;
    for (const recipient of campaign.recipients) {
      try {
        let trackingPixel = null;
        if (campaign.enableTracking) {
          trackingPixel = `${process.env.API_BASE_URL || 'https://tiktok-com-shop.onrender.com'}/track/${campaign._id}/${recipient._id}`;
        }

        const emailHtml = createProfessionalEmail(campaign.subject, campaign.content, trackingPixel);

        await transporter.sendMail({
          from: { name: 'BitHash Capital', address: 'info@bithashcapital.live' },
          to: recipient.email,
          subject: campaign.subject,
          html: emailHtml,
          headers: { 'X-Campaign-ID': campaign._id.toString(), 'X-Recipient-ID': recipient._id.toString(), 'X-Transporter': 'INFO' }
        });

        console.log(`✓ Sent to: ${recipient.email}`);
        successCount++;
        await EmailCampaign.updateOne({ _id: campaign._id, 'recipients._id': recipient._id }, { $set: { 'recipients.$.status': 'delivered' } });
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (emailError) {
        failCount++;
        console.error(`✗ Failed to send to ${recipient.email}:`, emailError.message);
        await EmailCampaign.updateOne({ _id: campaign._id, 'recipients._id': recipient._id }, { $set: { 'recipients.$.status': 'failed', 'recipients.$.error': emailError.message } });
      }
    }
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    await campaign.save();
    console.log(`Campaign completed: ${successCount} sent, ${failCount} failed`);
  } catch (error) {
    console.error('Campaign error:', error);
    campaign.status = 'failed';
    await campaign.save();
  }
}

// ======================
// Initialize Default Admin
// ======================
async function initializeDefaultData() {
  try {
    const adminCount = await AdminUser.countDocuments();
    if (adminCount === 0) {
      await AdminUser.create({ username: 'admin', password: 'admin123', name: 'System Administrator', role: 'superadmin' });
      console.log('Default admin user created: admin / admin123');
    }
    console.log('Default data initialized');
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

// ======================
// Error Handling
// ======================
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

app.use('*', (req, res) => {
  res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

// ======================
// Server Startup
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Professional Email Template Active`);
  console.log(`📤 Sender: info@bithashcapital.live`);
  console.log(`📋 Footer includes: Legal Disclaimer | Copyright | Address | Unsubscribe | Privacy Policy`);
  console.log(`${'='.repeat(60)}\n`);
  await initializeDefaultData();
});

module.exports = app;
