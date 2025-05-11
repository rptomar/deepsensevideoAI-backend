import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Registration from '../models/userregistration.js';
import bcrypt from 'bcrypt';

const router = express.Router();
router.post('/', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if user already exists
    const existingUser = await Registration.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new Registration({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    // Respond with success message
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

export default router;