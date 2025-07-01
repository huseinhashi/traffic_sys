import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { userSchema, loginSchema } from "../validators/validator.js";
import { User } from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.id,
      role: user.role,
      type: "user",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};
// User registration (public)
export const registerUser = async (req, res, next) => {
  try {
    // Validate registration data (without role field for registration)
    const { name, email, password } = req.body;
    const validatedData = userSchema
      .omit({ role: true })
      .parse({ name, email, password });

    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: validatedData.email },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    // Handle avatar upload if provided
    let avatarPath = null;
    if (req.file) {
      const uploadsDir = path.join(__dirname, "../uploads/avatars");

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileExt = path.extname(req.file.originalname);
      const fileName = `avatar_${uuidv4()}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write file to uploads directory
      fs.writeFileSync(filePath, req.file.buffer);
      avatarPath = `avatars/${fileName}`;
    }

    // Create new user with default role
    const newUser = await User.create({
      ...validatedData,
      role: "user", // Default role
      avatar: avatarPath,
    });

    // Generate JWT token
    const admintoken = generateToken(newUser);

    // Return user without password
    const userWithoutPassword = {
      ...newUser.get(),
      password: undefined,
    };

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        admintoken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// User login (public)
export const loginUser = async (req, res, next) => {
  try {
    // Validate login data
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await User.findOne({ where: { email: validatedData.email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.validPassword(validatedData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const admintoken = generateToken(user);

    // Return user without password
    const userWithoutPassword = {
      ...user.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        admintoken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin login (public)
export const loginAdmin = async (req, res, next) => {
  try {
    // Validate login data
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await User.findOne({ where: { email: validatedData.email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.validPassword(validatedData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin accounts can access this system.",
      });
    }

    // Generate JWT token
    const admintoken = generateToken(user);

    // Return user without password
    const userWithoutPassword = {
      ...user.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        admintoken,
      },
    });
  } catch (error) {
    next(error);
  }
};
