import { Conversation, User, Message } from "../models/index.js";
import { Op } from "sequelize";

// List all conversations (admin: all, user: only theirs)
export const getAllConversations = async (req, res, next) => {
  try {
    let whereClause = {};
    if (req.user.role !== "admin") {
      whereClause = {
        [Op.or]: [
          { user1_id: req.user.user_id },
          { user2_id: req.user.user_id },
        ],
      };
    }
    const conversations = await Conversation.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user1",
          attributes: ["id", "name", "email", "avatar", "role"],
        },
        {
          model: User,
          as: "user2",
          attributes: ["id", "name", "email", "avatar", "role"],
        },
        {
          model: Message,
          as: "messages",
          limit: 1,
          order: [["createdAt", "DESC"]],
          separate: true,
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "name", "email", "avatar", "role"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

// Get single conversation by ID (with messages)
export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findByPk(id, {
      include: [
        {
          model: User,
          as: "user1",
          attributes: ["id", "name", "email", "avatar", "role"],
        },
        {
          model: User,
          as: "user2",
          attributes: ["id", "name", "email", "avatar", "role"],
        },
        {
          model: Message,
          as: "messages",
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "name", "email", "avatar", "role"],
            },
          ],
          order: [["createdAt", "ASC"]],
        },
      ],
    });
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }
    // Only allow if admin or participant
    if (
      req.user.role !== "admin" &&
      conversation.user1_id !== req.user.user_id &&
      conversation.user2_id !== req.user.user_id
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

// Create conversation
export const createConversation = async (req, res, next) => {
  try {
    let { user1_id, user2_id } = req.body;
    if (req.user.role !== "admin") {
      user1_id = req.user.user_id;
      user2_id = req.body.user2_id;
    }
    if (!user1_id || !user2_id || user1_id === user2_id) {
      return res.status(400).json({
        success: false,
        message: "Both user IDs must be provided and different",
      });
    }
    // Check users exist
    const user1 = await User.findByPk(user1_id);
    const user2 = await User.findByPk(user2_id);
    if (!user1 || !user2) {
      return res
        .status(400)
        .json({ success: false, message: "One or both users not found" });
    }
    // Prevent duplicate conversation
    const existing = await Conversation.findOne({
      where: {
        [Op.or]: [
          { user1_id, user2_id },
          { user1_id: user2_id, user2_id: user1_id },
        ],
      },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Conversation already exists" });
    }
    const conversation = await Conversation.create({ user1_id, user2_id });
    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

// Update conversation (admin only)
export const updateConversation = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update conversations",
      });
    }
    const { id } = req.params;
    const { user1_id, user2_id } = req.body;
    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }
    if (!user1_id || !user2_id || user1_id === user2_id) {
      return res.status(400).json({
        success: false,
        message: "Both user IDs must be provided and different",
      });
    }
    // Check users exist
    const user1 = await User.findByPk(user1_id);
    const user2 = await User.findByPk(user2_id);
    if (!user1 || !user2) {
      return res
        .status(400)
        .json({ success: false, message: "One or both users not found" });
    }
    await conversation.update({ user1_id, user2_id });
    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

// Delete conversation (admin or participant)
export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }
    if (
      req.user.role !== "admin" &&
      conversation.user1_id !== req.user.user_id &&
      conversation.user2_id !== req.user.user_id
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    await conversation.destroy();
    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    next(error);
  }
};
