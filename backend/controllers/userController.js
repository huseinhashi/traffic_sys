import { User } from "../models/index.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { userSchema, loginSchema } from "../validators/validator.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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

// Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
export const getPublicUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { role: "user" },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single user by ID (admin only)
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new user (admin only)
export const createUser = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = userSchema.parse(req.body);

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

    // Create new user
    const newUser = await User.create({
      ...validatedData,
      avatar: avatarPath,
    });

    // Return user without password
    const userWithoutPassword = {
      ...newUser.get(),
      password: undefined,
    };

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Update a user (admin only)
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate request body (partial validation for updates)
    const validatedData = userSchema.partial().parse(req.body);

    // If updating email, check if it's already in use
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await User.findOne({
        where: { email: validatedData.email },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    // Handle avatar upload if provided
    let avatarPath = user.avatar;
    if (req.file) {
      const uploadsDir = path.join(__dirname, "../uploads/avatars");

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Delete old avatar if exists
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, "../uploads", user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      const fileExt = path.extname(req.file.originalname);
      const fileName = `avatar_${uuidv4()}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write file to uploads directory
      fs.writeFileSync(filePath, req.file.buffer);
      avatarPath = `avatars/${fileName}`;
    }

    // Update user
    await user.update({
      ...validatedData,
      avatar: avatarPath,
    });

    // Return user without password
    const userWithoutPassword = {
      ...user.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a user (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete avatar file if exists
    if (user.avatar) {
      const avatarPath = path.join(__dirname, "../uploads", user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await user.destroy();
    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
// Get current user profile
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update current user profile
export const updateCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate request body (partial validation for updates, exclude role)
    const validatedData = userSchema
      .partial()
      .omit({ role: true })
      .parse(req.body);

    // If updating email, check if it's already in use
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await User.findOne({
        where: { email: validatedData.email },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    // Handle avatar upload if provided
    let avatarPath = user.avatar;
    if (req.file) {
      const uploadsDir = path.join(__dirname, "../uploads/avatars");

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Delete old avatar if exists
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, "../uploads", user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      const fileExt = path.extname(req.file.originalname);
      const fileName = `avatar_${uuidv4()}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write file to uploads directory
      fs.writeFileSync(filePath, req.file.buffer);
      avatarPath = `avatars/${fileName}`;
    }

    // Update user
    await user.update({
      ...validatedData,
      avatar: avatarPath,
    });

    // Return user without password
    const userWithoutPassword = {
      ...user.get(),
      password: undefined,
    };

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};
