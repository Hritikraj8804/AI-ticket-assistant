import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";

export const signup = async (req, res) => {
  const { email, password, skills = [] } = req.body;
  
  // Sanitize inputs
  const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const sanitizedSkills = Array.isArray(skills) ? skills.filter(s => typeof s === 'string') : [];
  
  if (!sanitizedEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    // Check if this is the first user (make them admin)
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      email: sanitizedEmail, 
      password: hashed, 
      skills: sanitizedSkills,
      role: role
    });

    //Fire inngest event

    await inngest.send({
      name: "user/signup",
      data: {
        email: sanitizedEmail,
      },
    });

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: "Signup failed", details: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  // Sanitize inputs
  const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  
  if (!sanitizedEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) return res.status(401).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorzed" });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: "Unauthorized" });
    });
    res.json({ message: "Logout successfully" });
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { skills = [], role, email } = req.body;
  
  // Sanitize inputs
  const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const sanitizedSkills = Array.isArray(skills) ? skills.filter(s => typeof s === 'string') : [];
  const sanitizedRole = ['user', 'moderator', 'admin'].includes(role) ? role : undefined;
  
  if (!sanitizedEmail) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) return res.status(401).json({ error: "User not found" });

    const updateData = {};
    if (sanitizedSkills.length >= 0) updateData.skills = sanitizedSkills; // Allow empty skills
    if (sanitizedRole) updateData.role = sanitizedRole;
    
    await User.updateOne({ email: sanitizedEmail }, updateData);
    return res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Update failed", details: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const users = await User.find().select("-password");
    return res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Update failed", details: error.message });
  }
};

// One-time refresh for old tickets (admin only)
export const refreshOldTickets = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Find tickets without priority or assignment
    const oldTickets = await Ticket.find({
      $or: [
        { priority: { $exists: false } },
        { priority: null },
        { assignedTo: null },
        { helpfulNotes: { $exists: false } }
      ]
    }).limit(10);
    
    // Debug: Check if admin users exist
    const adminCount = await User.countDocuments({ role: { $in: ['admin', 'moderator'] } });
    console.log('🔄 Admin/Moderator users available:', adminCount);

    if (oldTickets.length === 0) {
      return res.json({ message: "No tickets need refreshing" });
    }

    // Process each ticket
    for (const ticket of oldTickets) {
        await inngest.send({
        name: "ticket/refresh",
        data: {
          ticketId: ticket._id.toString(),
          title: ticket.title,
          description: ticket.description,
        },
      });
    }

    res.json({ 
      message: `Refreshing ${oldTickets.length} tickets`,
      count: oldTickets.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create admin user (no auth required)
export const createAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({ 
      email: email.trim().toLowerCase(), 
      password: hashed, 
      role: 'admin'
    });
    
    res.json({ message: 'Admin created successfully', email: admin.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create moderator with skills (admin only)
export const createModerator = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const { email, password, skills = [] } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const sanitizedSkills = Array.isArray(skills) ? skills.filter(s => typeof s === 'string') : [];
    
    const hashed = await bcrypt.hash(password, 10);
    const moderator = await User.create({ 
      email: email.trim().toLowerCase(), 
      password: hashed, 
      role: 'moderator',
      skills: sanitizedSkills
    });
    
    res.json({ 
      message: 'Moderator created successfully', 
      email: moderator.email,
      skills: moderator.skills 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update own profile (for existing users to add skills)
export const updateProfile = async (req, res) => {
  try {
    const { skills = [] } = req.body;
    const sanitizedSkills = Array.isArray(skills) ? skills.filter(s => typeof s === 'string') : [];
    
    await User.updateOne(
      { _id: req.user._id }, 
      { skills: sanitizedSkills }
    );
    
    const updatedUser = await User.findById(req.user._id).select('-password');
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};