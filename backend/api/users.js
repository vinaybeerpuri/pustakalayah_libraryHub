// User Management API
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable
const UPLOADS_DIR = path.join(__dirname, '../uploads/avatars');

// Ensure uploads directory exists
(async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads directory', err);
  }
})();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Initialize users data if file doesn't exist
async function initializeUsers() {
  try {
    await fs.access(USERS_FILE);
  } catch (error) {
    // Create the data directory if it doesn't exist
    const dataDir = path.dirname(USERS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    const defaultPassword = await bcrypt.hash('admin', 10);
    const defaultUsers = [
      {
        id: 1,
        username: 'admin',
        password: defaultPassword,
        email: 'admin@library.com',
        name: 'Admin User',
        memberSince: new Date().toISOString(),
        role: 'admin'
      }
    ];
    await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

// Middleware to ensure user is authenticated
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    await initializeUsers();
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if email is verified
    if (user.emailVerified === false || user.emailVerified === undefined) {
      return res.status(403).json({ 
        error: 'Email not verified. Please verify your email before logging in.',
        requiresVerification: true,
        userId: user.id
      });
    }

    // For admin user with plaintext password
    if (user.username === 'admin' && !user.password.startsWith('$')) {
      if (password === user.password) {
        // Update admin password to hashed version
        user.password = await bcrypt.hash(password, 10);
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      }
    } else {
      // For regular users, verify hashed password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    }

    // Create and sign JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OTP storage (in-memory, expires after 10 minutes)
const otpStore = new Map();

// Email verification token storage (in-memory, expires after 24 hours)
const emailVerificationStore = new Map();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate email verification token
function generateVerificationToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    await initializeUsers();
    const { username, email, password, mobile } = req.body;

    console.log('Registration attempt:', { username, email, mobile }); // Debug log

    // Validate input
    if (!username || !email || !password || !mobile) {
      return res.status(400).json({ error: 'All fields including mobile number are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Validate mobile number format (basic validation)
    const mobileRegex = /^\+?[1-9]\d{1,14}$/;
    if (!mobileRegex.test(mobile.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Please enter a valid mobile number' });
    }

    let data;
    try {
      data = await fs.readFile(USERS_FILE, 'utf8');
    } catch (error) {
      console.error('Error reading users file:', error);
      // If file doesn't exist, initialize with empty array
      data = '[]';
    }

    const users = JSON.parse(data);

    // Check if username or email already exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (users.some(u => u.mobile && u.mobile === mobile)) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with avatar, mobile, and email verification support
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      mobile: mobile.replace(/\s/g, ''), // Remove spaces
      password: hashedPassword,
      memberSince: new Date().toISOString(),
      role: 'member',
      avatar: req.body.avatar || null,
      emailVerified: false // Email not verified by default
    };

    users.push(newUser);

    // Ensure the data directory exists
    const dataDir = path.dirname(USERS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    // Write updated users to file
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Store verification token
    emailVerificationStore.set(newUser.id.toString(), {
      token: verificationToken,
      expiresAt,
      userId: newUser.id,
      email: newUser.email
    });

    // In production, send verification email
    // For now, log the verification link (in production, send via email service)
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/users/verify-email?token=${verificationToken}`;
    console.log(`Email verification link for ${email}: ${verificationUrl}`);
    console.log('⚠️  In production, this link should be sent via email service');

    console.log('User registered successfully:', { username, email }); // Debug log

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      // In development, return verification token for testing
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined,
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined,
      user: userWithoutPassword
      // Note: No token returned - user must verify email before login
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// GET all users (protected route)
router.get('/', authenticateToken, async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET user by ID (protected route)
// GET current user (from token)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.id === parseInt(req.user.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET user by ID (protected route)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.id === parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // remove password before sending
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    const { username, email, password, name } = req.body;
    
    // Check if user already exists
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password: hashedPassword,
      name: name || username,
      memberSince: new Date().toISOString(),
      role: 'member'
    };

    users.push(newUser);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    // Do not return password in response
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update user (protected: only owner or admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Authorization: only the owner or admin can update
    const requesterId = parseInt(req.user.id);
    const requesterRole = req.user.role;
    const targetUserId = parseInt(req.params.id);

    if (requesterRole !== 'admin' && requesterId !== targetUserId) {
      return res.status(403).json({ error: 'Forbidden: you can only update your own profile' });
    }

    const { name, email, avatar } = req.body;
    // Allow updating name, email and avatar
    // If email is changed, reset email verification status
    const emailChanged = email !== undefined && email !== users[userIndex].email;
    users[userIndex] = {
      ...users[userIndex],
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
      // Reset email verification if email changed
      ...(emailChanged ? { emailVerified: false } : {})
    };

    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const filteredUsers = users.filter(u => u.id !== parseInt(req.params.id));
    
    if (users.length === filteredUsers.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await fs.writeFile(USERS_FILE, JSON.stringify(filteredUsers, null, 2));
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Helper to persist avatar file path on a user and return sanitized record
async function persistAvatarForUser(userId, file, req) {
  if (!file) {
    throw Object.assign(new Error('No file uploaded'), { status: 400 });
  }

  await initializeUsers();
  const data = await fs.readFile(USERS_FILE, 'utf8');
  const users = JSON.parse(data);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${file.filename}`;
  users[idx].avatar = fileUrl;
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

  const { password, ...userWithoutPassword } = users[idx];
  return userWithoutPassword;
}

// POST avatar upload by ID (protected)
router.post('/:id/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updatedUser = await persistAvatarForUser(userId, req.file, req);
    res.json(updatedUser);
  } catch (error) {
    console.error('Avatar upload error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to upload avatar' });
  }
});

// POST current user's avatar (protected) – matches frontend /api/users/me/avatar
router.post('/me/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    const updatedUser = await persistAvatarForUser(userId, req.file, req);
    res.json(updatedUser);
  } catch (error) {
    console.error('Current user avatar upload error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to upload avatar' });
  }
});

// Forgot Password - Request OTP
router.post('/forgot-password', async (req, res) => {
  try {
    await initializeUsers();
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    // Find user by username or email
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() || 
      u.email.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mobile) {
      return res.status(400).json({ error: 'Mobile number not registered for this account' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP with user ID
    otpStore.set(user.id.toString(), {
      otp,
      expiresAt,
      userId: user.id
    });

    // In production, send OTP via SMS service (Twilio, etc.)
    // For now, log it to console (in production, remove this)
    console.log(`OTP for ${user.username} (${user.mobile}): ${otp}`);
    console.log('⚠️  In production, this OTP should be sent via SMS service');

    res.json({ 
      success: true, 
      message: 'OTP sent to your registered mobile number',
      // In development, return OTP for testing (remove in production)
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { username, otp } = req.body;

    if (!username || !otp) {
      return res.status(400).json({ error: 'Username and OTP are required' });
    }

    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() || 
      u.email.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const storedOtp = otpStore.get(user.id.toString());

    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP not found or expired. Please request a new OTP' });
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(user.id.toString());
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP' });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP verified - mark as verified (don't delete yet, need it for password reset)
    storedOtp.verified = true;
    otpStore.set(user.id.toString(), storedOtp);

    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      userId: user.id
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { username, otp, newPassword } = req.body;

    if (!username || !otp || !newPassword) {
      return res.status(400).json({ error: 'Username, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    const userIndex = users.findIndex(u => 
      u.username.toLowerCase() === username.toLowerCase() || 
      u.email.toLowerCase() === username.toLowerCase()
    );

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];
    const storedOtp = otpStore.get(user.id.toString());

    if (!storedOtp || !storedOtp.verified) {
      return res.status(400).json({ error: 'OTP not verified. Please verify OTP first' });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(user.id.toString());
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[userIndex].password = hashedPassword;

    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    // Delete OTP after successful password reset
    otpStore.delete(user.id.toString());

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify Email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find token in store
    let foundUserId = null;
    let foundToken = null;
    for (const [userId, tokenData] of emailVerificationStore.entries()) {
      if (tokenData.token === token) {
        foundUserId = userId;
        foundToken = tokenData;
        break;
      }
    }

    if (!foundToken) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    if (Date.now() > foundToken.expiresAt) {
      emailVerificationStore.delete(foundUserId);
      return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
    }

    // Update user's email verification status
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const userIndex = users.findIndex(u => u.id === foundToken.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].emailVerified = true;
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    // Delete verification token after successful verification
    emailVerificationStore.delete(foundUserId);

    // Return success page HTML or JSON
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; }
          h1 { color: #4CAF50; }
          a { color: #667eea; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Email Verified Successfully!</h1>
          <p>Your email has been verified. You can now login to your account.</p>
          <a href="/">Go to Login</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend Verification Email
router.post('/resend-verification', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() || 
      u.email.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Store verification token
    emailVerificationStore.set(user.id.toString(), {
      token: verificationToken,
      expiresAt,
      userId: user.id,
      email: user.email
    });

    // In production, send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/users/verify-email?token=${verificationToken}`;
    console.log(`Resent email verification link for ${user.email}: ${verificationUrl}`);
    console.log('⚠️  In production, this link should be sent via email service');

    res.json({ 
      success: true, 
      message: 'Verification email sent. Please check your email.',
      // In development, return verification token for testing
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined,
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Note: authentication/login is handled by the JWT-based /login route above

module.exports = router;
