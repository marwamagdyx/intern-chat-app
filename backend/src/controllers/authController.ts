
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';



const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const register = async (req: Request, res: Response) => {
    try {
        const { fname, lname, username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }


        const newUser = new User({
          fname,
          lname,
            username,
            email,
            password: password,
        });

        const savedUser = await newUser.save();

        const token = jwt.sign({ userId: savedUser._id}, JWT_SECRET, {
            expiresIn: '1h',
        });

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: savedUser._id,
                fname: savedUser.get('fname'),
                lname: savedUser.get('lname'),
                username: savedUser.get('username'),
                email: savedUser.email,
            },
            token,
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(400).json({ message: 'User not found' });
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("🚀 ~ login ~ user.password:", user.password)
      console.log("🚀 ~ login ~ password:", password)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log("🚀 ~ login ~ hashedPassword:", hashedPassword)
            console.log("🚀 ~ login ~ user.password:", user.password)

      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

      // Send token and user info
      res.json({ token, user: { id: user._id, email: user.email, username: user.get('username') } });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
  }
};