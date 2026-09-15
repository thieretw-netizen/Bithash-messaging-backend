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
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://pesalifeke:_d84QE_x2k763Q#@cryptotradingmarket.dpoatp3.mongodb.net/?appName=cryptotradingmarket')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ======================
// Email Configuration - Using only info transporter
// ======================
const createTransporter = (user, pass) => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      rejectUnauthorized: false
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100
  });
};

const infoTransporter = createTransporter(
  process.env.EMAIL_INFO_USER,
  process.env.EMAIL_INFO_PASS
);

const supportTransporter = createTransporter(
  process.env.EMAIL_SUPPORT_USER,
  process.env.EMAIL_SUPPORT_PASS
);

const transporter = supportTransporter;

transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server ready. Sender: support@bithashcapital.live');
  }
});

// ======================
// PROFESSIONAL EMAIL TEMPLATE - ₿itHash Branding with Bold Tagline
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
      padding: 0;
      line-height: 1.5;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    .email-container {
      max-width: 600px;
      width: 100%;
      margin: 0 auto;
      background-color: #FFFFFF;
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
      font-weight: 700;
      font-style: italic;
    }
    /* BODY SECTION */
    .email-body {
      padding: 32px 28px;
      background-color: #FFFFFF;
      color: #1E293B;
    }
    /* FOOTER SECTION */
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
      body { 
        padding: 0 !important; 
        margin: 0 !important;
        width: 100% !important;
        background-color: #F1F5F9 !important;
      }
      .email-container { 
        max-width: 100% !important; 
        width: 100% !important; 
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      .email-body { 
        padding: 24px 20px; 
      }
      .email-header { 
        padding: 24px 20px; 
      }
      .email-title { 
        font-size: 24px; 
      }
      .footer-links a { 
        display: inline-block; 
        margin: 4px 6px; 
      }
      .footer-disclaimer { 
        font-size: 10px; 
      }
      .email-footer {
        padding: 20px 16px;
      }
      .email-timestamp {
        padding: 16px 20px;
        margin: 0;
      }
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
      <h1 class="email-title">₿itHash Capital</h1>
      <p class="email-tagline"><i><strong>Where Your Financial Goals Become Reality</strong></i></p>
    </div>
    
    <!-- BODY SECTION - Admin content goes here -->
    <div class="email-body">
      ${contentWithTracking}
    </div>
    
    <!-- FOOTER SECTION -->
    <div class="email-footer">
      <p class="footer-disclaimer">
        This material is for informational purposes only and does not constitute investment advice. 
        Cryptocurrency markets involve substantial risk.
      </p>
      <p class="footer-copyright">© ${new Date().getFullYear()} ₿itHash Capital — All rights reserved.</p>
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
    status: {
      type: String,
      default: 'queued',
      enum: ['queued', 'sent', 'delivered', 'opened', 'bounced', 'failed']
    },
    messageId: { type: String, index: true },
    queuedAt: Date,
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    lastOpenedAt: Date,
    openCount: { type: Number, default: 0 },
    deliveryEvents: { type: Number, default: 0 },
    lastDeliveryEventAt: Date,
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
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign', required: true, index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  event: { type: String, enum: ['open', 'delivery'], default: 'open', index: true },
  occurredAt: { type: Date, default: Date.now, index: true },
  ipAddress: String,
  userAgent: String,
  messageId: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

trackingPixelSchema.index({ campaignId: 1, recipientId: 1, event: 1, occurredAt: -1 });

const AdminUser = mongoose.model('AdminUser', adminUserSchema);
const Investor = mongoose.model('Investor', investorSchema);
const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema);
const TrackingPixel = mongoose.model('TrackingPixel', trackingPixelSchema);

// Useful indexes for campaign dashboards and high-volume tracking.
EmailCampaign.collection.createIndex({ sentAt: -1 }).catch(err => console.error('EmailCampaign index error:', err));
EmailCampaign.collection.createIndex({ 'recipients.email': 1 }).catch(err => console.error('EmailCampaign recipient index error:', err));
TrackingPixel.collection.createIndex({ campaignId: 1, occurredAt: -1 }).catch(err => console.error('TrackingPixel index error:', err));

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
// Email Tracking Helpers
// ======================

const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
};

const getTrackingBaseUrl = () => {
  const base = (process.env.API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (base) return base;
  return 'https://tiktok-com-shop.onrender.com';
};

const normalizeDeliveryEvent = (value) => {
  const event = String(value || '').toLowerCase().trim();
  if (['delivered', 'delivery', 'delivered_success'].includes(event)) return 'delivered';
  if (['bounce', 'bounced', 'hard_bounce', 'soft_bounce', 'failed', 'failure'].includes(event)) return 'bounced';
  if (['sent', 'accepted', 'queued'].includes(event)) return 'sent';
  return null;
};

const recordDeliveryEvent = async ({ campaignId, recipientId, event, messageId, error, metadata = {} }) => {
  const normalizedEvent = normalizeDeliveryEvent(event);
  if (!normalizedEvent) throw new Error('Unsupported delivery event');

  const campaign = await EmailCampaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  const recipient = campaign.recipients.id(recipientId);
  if (!recipient) throw new Error('Recipient not found');

  const now = new Date();
  const set = {
    'recipients.$.lastDeliveryEventAt': now,
    'recipients.$.deliveryEvents': (recipient.deliveryEvents || 0) + 1
  };

  if (messageId) set['recipients.$.messageId'] = String(messageId);
  if (error) set['recipients.$.error'] = String(error);

  if (normalizedEvent === 'delivered') {
    set['recipients.$.status'] = 'delivered';
    set['recipients.$.deliveredAt'] = recipient.deliveredAt || now;
  } else if (normalizedEvent === 'bounced') {
    set['recipients.$.status'] = 'bounced';
  } else if (normalizedEvent === 'sent' && recipient.status !== 'delivered') {
    set['recipients.$.status'] = 'sent';
    set['recipients.$.sentAt'] = recipient.sentAt || now;
  }

  await EmailCampaign.updateOne(
    { _id: campaignId, 'recipients._id': recipientId },
    { $set: set }
  );

  await TrackingPixel.create({
    campaignId,
    recipientId,
    event: 'delivery',
    occurredAt: now,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    messageId: messageId || recipient.messageId,
    metadata: { providerEvent: normalizedEvent, error: error || null }
  });

  return normalizedEvent;
};

const recordOpenEvent = async ({ campaignId, recipientId, req }) => {
  const campaign = await EmailCampaign.findById(campaignId);
  if (!campaign) return;

  const recipient = campaign.recipients.id(recipientId);
  if (!recipient) return;

  const now = new Date();
  const ipAddress = getClientIp(req);
  const userAgent = req.get('User-Agent') || '';

  // Store every observed pixel request as an event, but only count the
  // first observed open once for campaign-level unique-open statistics.
  await TrackingPixel.create({
    campaignId,
    recipientId,
    event: 'open',
    occurredAt: now,
    ipAddress,
    userAgent,
    messageId: recipient.messageId
  });

  const wasOpened = !!recipient.openedAt;

  await EmailCampaign.updateOne(
    { _id: campaignId, 'recipients._id': recipientId },
    {
      $set: {
        'recipients.$.status': 'opened',
        'recipients.$.openedAt': recipient.openedAt || now,
        'recipients.$.lastOpenedAt': now
      },
      $inc: { 'recipients.$.openCount': 1, openCount: wasOpened ? 0 : 1 }
    }
  );
};

// ======================
// API Routes
// ======================

app.get('/health', (req, res) => {
  res.json({ status: 'success', message: '₿itHash Capital server is running smoothly', timestamp: new Date().toISOString(), uptime: process.uptime() });
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
    const emailCampaigns = await EmailCampaign.find({ status: { $in: ['sent', 'failed'] } }).select('recipients openCount');
    let totalRecipients = 0, totalDelivered = 0, totalOpened = 0;
    emailCampaigns.forEach(campaign => {
      for (const recipient of campaign.recipients) {
        totalRecipients++;
        if (['delivered', 'opened'].includes(recipient.status)) totalDelivered++;
      }
      totalOpened += campaign.openCount || 0;
    });
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered * 100).toFixed(1) : 0;
    const deliveryRate = totalRecipients > 0 ? (totalDelivered / totalRecipients * 100).toFixed(1) : 0;
    res.json({
      status: 'success',
      data: {
        totalInvestors,
        emailsSent,
        totalRecipients,
        totalDelivered,
        deliveryRate: parseFloat(deliveryRate),
        openRate: parseFloat(openRate),
        lastActivity: new Date().toISOString(),
        investorTrend: 2.5,
        emailTrend: 1.8,
        openTrend: -0.5,
        activityTime: 'Just now'
      }
    });
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
        // Deduplicate email addresses in manual mode
        const uniqueEmails = [...new Set(recipients)];
        if (uniqueEmails.length !== recipients.length) {
          console.log(`Removed ${recipients.length - uniqueEmails.length} duplicate email(s) from manual recipients`);
        }
        recipientInvestors = uniqueEmails.map(email => ({ email, name: email }));
      } else {
        // Deduplicate investor IDs
        const uniqueRecipientIds = [...new Set(recipients)];
        if (uniqueRecipientIds.length !== recipients.length) {
          console.log(`Removed ${recipients.length - uniqueRecipientIds.length} duplicate investor ID(s) from selected investors`);
        }
        recipientInvestors = await Investor.find({ _id: { $in: uniqueRecipientIds }, status: 'active' });
      }
    } else {
      recipientInvestors = await Investor.find({ status: 'active' });
    }
    
    // Final deduplication by email address to ensure no duplicate receives email
    const uniqueEmailMap = new Map();
    for (const inv of recipientInvestors) {
      if (!uniqueEmailMap.has(inv.email)) {
        uniqueEmailMap.set(inv.email, inv);
      }
    }
    const finalRecipients = Array.from(uniqueEmailMap.values());
    const totalDuplicatesRemoved = recipientInvestors.length - finalRecipients.length;
    if (totalDuplicatesRemoved > 0) {
      console.log(`Removed ${totalDuplicatesRemoved} duplicate email address(es) from final recipient list. Each recipient will receive exactly one email.`);
    }
    
    if (finalRecipients.length === 0) return res.status(400).json({ status: 'error', message: 'No valid recipients found' });
    
    const campaign = new EmailCampaign({
      subject, content,
      recipients: finalRecipients.map(inv => ({ investorId: inv._id || null, email: inv.email, name: inv.name || inv.email, status: 'sent' })),
      sentBy: req.user._id, enableTracking, status: scheduleEmail ? 'scheduled' : 'sent',
      scheduledFor: scheduleEmail ? new Date(scheduleDate) : null, templateId: templateId || null
    });
    await campaign.save();
    if (saveAsTemplate && templateName) {
      const template = new EmailTemplate({ name: templateName, subject, content, category: 'general' });
      await template.save();
    }
    if (!scheduleEmail) await sendEmailCampaign(campaign);
    res.json({ status: 'success', message: `Email campaign created successfully. ${finalRecipients.length} recipients.`, data: { campaignId: campaign._id, recipientCount: finalRecipients.length, scheduled: scheduleEmail } });
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
    
    // Deduplicate emails from Excel file
    const uniqueEmails = [...new Set(emails)];
    if (uniqueEmails.length !== emails.length) {
      console.log(`Removed ${emails.length - uniqueEmails.length} duplicate email(s) from Excel file`);
    }
    
    const recipientInvestors = uniqueEmails.map(email => ({ email, name: email }));
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
    const emails = await EmailCampaign.find(query).populate('sentBy', 'name username').sort({ sentAt: -1 }).skip(skip).limit(limit).select('-content');
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
    const campaigns = await EmailCampaign.find({ sentAt: { $gte: startDate } }).select('recipients openCount');
    let totalSent = 0, totalDelivered = 0, totalOpened = 0, totalBounced = 0, totalFailed = 0;
    campaigns.forEach(campaign => {
      for (const recipient of campaign.recipients) {
        if (['sent', 'delivered', 'opened', 'bounced', 'failed'].includes(recipient.status)) totalSent++;
        if (['delivered', 'opened'].includes(recipient.status)) totalDelivered++;
        if (recipient.status === 'bounced') totalBounced++;
        if (recipient.status === 'failed') totalFailed++;
      }
      totalOpened += campaign.openCount || 0;
    });
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent * 100).toFixed(1) : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered * 100).toFixed(1) : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent * 100).toFixed(1) : 0;
    res.json({
      status: 'success',
      data: {
        totalSent,
        totalDelivered,
        totalOpened,
        totalBounced,
        totalFailed,
        deliveryRate: parseFloat(deliveryRate),
        openRate: parseFloat(openRate),
        bounceRate: parseFloat(bounceRate),
        clickRate: 0,
        unsubscribeRate: 0,
        deliveryTrend: 0,
        openTrend: 0,
        clickTrend: 0,
        unsubscribeTrend: 0
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load analytics' });
  }
});

app.get('/track/:campaignId/:recipientId', async (req, res) => {
  try {
    const { campaignId, recipientId } = req.params;
    await recordOpenEvent({ campaignId, recipientId, req });

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': TRACKING_PIXEL.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(TRACKING_PIXEL);
  } catch (error) {
    // Tracking must never break email rendering.
    console.error('Tracking pixel error:', error.message);
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': TRACKING_PIXEL.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(TRACKING_PIXEL);
  }
});

// Provider delivery-status webhook.
// Configure your SMTP/email provider to POST normalized events here.
// Required header: x-email-tracking-secret === EMAIL_TRACKING_WEBHOOK_SECRET
app.post('/webhooks/email-delivery', async (req, res) => {
  try {
    const configuredSecret = process.env.EMAIL_TRACKING_WEBHOOK_SECRET;
    if (!configuredSecret) {
      console.error('EMAIL_TRACKING_WEBHOOK_SECRET is not configured');
      return res.status(503).json({ status: 'error', message: 'Delivery webhook is not configured' });
    }

    const suppliedSecret = req.get('x-email-tracking-secret') || '';
    const supplied = Buffer.from(String(suppliedSecret));
    const expected = Buffer.from(String(configuredSecret));

    if (supplied.length !== expected.length ||
        !crypto.timingSafeEqual(supplied, expected)) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const {
      campaignId,
      recipientId,
      event,
      messageId = null,
      error = null,
      metadata = {}
    } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(campaignId) ||
        !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid campaignId or recipientId' });
    }

    const normalizedEvent = await recordDeliveryEvent({
      campaignId,
      recipientId,
      event,
      messageId,
      error,
      metadata: {
        ipAddress: getClientIp(req),
        userAgent: req.get('User-Agent') || '',
        ...metadata
      }
    });

    return res.json({
      status: 'success',
      message: 'Email delivery event recorded',
      data: { campaignId, recipientId, event: normalizedEvent }
    });
  } catch (error) {
    console.error('Email delivery webhook error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to record delivery event' });
  }
});

// Detailed campaign tracking for the admin dashboard.
app.get('/admin/emails/:id/tracking', authenticateToken, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('sentBy', 'name username')
      .select('-content');

    if (!campaign) {
      return res.status(404).json({ status: 'error', message: 'Email campaign not found' });
    }

    const events = await TrackingPixel.find({ campaignId: campaign._id })
      .sort({ occurredAt: -1 })
      .lean();

    const recipients = campaign.recipients.map(recipient => ({
      id: recipient._id,
      investorId: recipient.investorId,
      email: recipient.email,
      name: recipient.name,
      status: recipient.status,
      messageId: recipient.messageId || null,
      queuedAt: recipient.queuedAt || null,
      sentAt: recipient.sentAt || null,
      deliveredAt: recipient.deliveredAt || null,
      openedAt: recipient.openedAt || null,
      lastOpenedAt: recipient.lastOpenedAt || null,
      openCount: recipient.openCount || 0,
      deliveryEvents: recipient.deliveryEvents || 0,
      lastDeliveryEventAt: recipient.lastDeliveryEventAt || null,
      error: recipient.error || null
    }));

    const total = recipients.length;
    const delivered = recipients.filter(r => ['delivered', 'opened'].includes(r.status)).length;
    const opened = recipients.filter(r => !!r.openedAt).length;
    const bounced = recipients.filter(r => r.status === 'bounced').length;
    const failed = recipients.filter(r => r.status === 'failed').length;

    res.json({
      status: 'success',
      data: {
        campaign: {
          id: campaign._id,
          subject: campaign.subject,
          status: campaign.status,
          sentAt: campaign.sentAt,
          sentBy: campaign.sentBy?.name || 'System',
          enableTracking: campaign.enableTracking
        },
        summary: {
          total,
          delivered,
          opened,
          bounced,
          failed,
          deliveryRate: total ? Number((delivered / total * 100).toFixed(1)) : 0,
          openRate: delivered ? Number((opened / delivered * 100).toFixed(1)) : 0
        },
        recipients,
        events
      }
    });
  } catch (error) {
    console.error('Email tracking details error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load email tracking' });
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
    const campaigns = await EmailCampaign.find({ status: { $in: ['sent', 'failed'] } }).populate('sentBy', 'name').sort({ sentAt: -1 }).select('subject sentAt openCount recipients');
    const csvHeader = 'Subject,Sent Date,Recipients,Delivered,Opened,Bounced,Failed,Delivery Rate,Open Rate,Sent By\n';
    const csvRows = campaigns.map(campaign => {
      const total = campaign.recipients?.length || 0;
      const delivered = campaign.recipients?.filter(r => ['delivered', 'opened'].includes(r.status)).length || 0;
      const opened = campaign.recipients?.filter(r => !!r.openedAt).length || 0;
      const bounced = campaign.recipients?.filter(r => r.status === 'bounced').length || 0;
      const failed = campaign.recipients?.filter(r => r.status === 'failed').length || 0;
      const deliveryRate = total ? ((delivered / total) * 100).toFixed(1) : '0.0';
      const openRate = delivered ? ((opened / delivered) * 100).toFixed(1) : '0.0';
      return `"${campaign.subject.replace(/"/g, '""')}","${new Date(campaign.sentAt).toISOString()}",${total},${delivered},${opened},${bounced},${failed},${deliveryRate}%,${openRate}%,"${campaign.sentBy?.name || 'System'}"`;
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
  console.log(`Sender: support@bithashcapital.live`);

  try {
    let successCount = 0, failCount = 0;
    const sentEmailsSet = new Set();

    for (const recipient of campaign.recipients) {
      if (sentEmailsSet.has(recipient.email)) {
        console.log(`⚠ Skipping duplicate email: ${recipient.email} - already sent in this campaign`);
        continue;
      }

      try {
        const queuedAt = new Date();
        await EmailCampaign.updateOne(
          { _id: campaign._id, 'recipients._id': recipient._id },
          {
            $set: {
              'recipients.$.status': 'queued',
              'recipients.$.queuedAt': queuedAt,
              'recipients.$.error': null
            }
          }
        );

        let trackingPixel = null;
        if (campaign.enableTracking) {
          // Cache-busting query parameter reduces false negatives caused by
          // aggressive image/proxy caching while the endpoint remains idempotent.
          trackingPixel =
            `${getTrackingBaseUrl()}/track/${campaign._id}/${recipient._id}?v=${crypto.randomBytes(12).toString('hex')}`;
        }

        const emailHtml = createProfessionalEmail(
          campaign.subject,
          campaign.content,
          trackingPixel
        );

        const info = await transporter.sendMail({
          from: { name: '₿itHash Capital', address: 'support@bithashcapital.live' },
          to: recipient.email,
          subject: campaign.subject,
          html: emailHtml,
          headers: {
            'X-Campaign-ID': campaign._id.toString(),
            'X-Recipient-ID': recipient._id.toString(),
            'X-Transporter': 'SUPPORT'
          }
        });

        const sentAt = new Date();
        const messageId = info.messageId || null;

        console.log(`✓ Accepted by SMTP transport: ${recipient.email} (${messageId || 'no-message-id'})`);
        sentEmailsSet.add(recipient.email);
        successCount++;

        await EmailCampaign.updateOne(
          { _id: campaign._id, 'recipients._id': recipient._id },
          {
            $set: {
              'recipients.$.status': 'sent',
              'recipients.$.sentAt': sentAt,
              'recipients.$.messageId': messageId
            }
          }
        );

        // "sent" means the SMTP transport accepted the message.
        // "delivered" is set only by the provider delivery webhook.
        await TrackingPixel.create({
          campaignId: campaign._id,
          recipientId: recipient._id,
          event: 'delivery',
          occurredAt: sentAt,
          messageId,
          metadata: {
            providerEvent: 'sent',
            acceptedByTransport: true,
            response: info.response || null,
            envelope: info.envelope || null
          }
        });

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (emailError) {
        failCount++;
        console.error(`✗ Failed to send to ${recipient.email}:`, emailError.message);

        await EmailCampaign.updateOne(
          { _id: campaign._id, 'recipients._id': recipient._id },
          {
            $set: {
              'recipients.$.status': 'failed',
              'recipients.$.error': emailError.message
            }
          }
        );
      }
    }

    campaign.status = successCount > 0 ? 'sent' : 'failed';
    campaign.sentAt = new Date();
    await campaign.save();

    console.log(
      `Campaign completed: ${successCount} accepted by SMTP, ${failCount} failed, ` +
      `${campaign.recipients.length - successCount - failCount} duplicates skipped`
    );
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
      console.log('₿itHash Capital admin panel ready');
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
  console.log(`🚀 ₿itHash Capital Server running on port ${PORT}`);
  console.log(`📧 Professional Email Template Active`);
  console.log(`📤 Sender: support@bithashcapital.live`);
  console.log(`📈 Email delivery + open tracking enabled`);
  console.log(`📋 Footer includes: Legal Disclaimer | Copyright | Address | Unsubscribe | Privacy Policy`);
  console.log(`🏷️ Branding: ₿itHash Capital throughout`);
  console.log(`💪 Tagline: "Where Your Financial Goals Become Reality" (BOLD)`);
  console.log(`${'='.repeat(60)}\n`);
  await initializeDefaultData();
});

module.exports = app;
