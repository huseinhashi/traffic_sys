import { Message, Conversation, User } from "../models/index.js";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for image upload
const handleImageUpload = (req) => {
  let imagePath = null;
  if (req.file) {
    const uploadsDir = path.join(__dirname, "../uploads/messages");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const fileExt = path.extname(req.file.originalname);
    const fileName = `msg_${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);
    imagePath = `messages/${fileName}`;
  }
  return imagePath;
};

// List messages for a conversation
export const getMessagesByConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findByPk(id);
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
    const messages = await Message.findAll({
      where: { conversation_id: id },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "email", "avatar", "role"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// Create message
export const createMessage = async (req, res, next) => {
  try {
    const { id } = req.params; // conversation id from URL
    let { sender_id, content, message_type } = req.body;
    if (req.user.role !== "admin") {
      sender_id = req.user.user_id;
    }
    if (!sender_id) {
      return res
        .status(400)
        .json({ success: false, message: "Sender ID required" });
    }
    // Check conversation exists
    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }
    // Only allow if admin or participant
    if (
      req.user.role !== "admin" &&
      conversation.user1_id !== sender_id &&
      conversation.user2_id !== sender_id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to send message in this conversation",
      });
    }
    // Handle image upload
    const imagePath = handleImageUpload(req);
    if (!content && !imagePath) {
      return res.status(400).json({
        success: false,
        message: "Message must have content or image",
      });
    }
    if (!message_type) {
      if (content && imagePath) message_type = "text_image";
      else if (content) message_type = "text";
      else message_type = "image";
    }
    const message = await Message.create({
      conversation_id: id, // Use the conversation ID from URL params
      sender_id,
      content,
      image: imagePath,
      message_type,
    });
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "email", "avatar", "role"],
        },
      ],
    });
    res.status(201).json({ success: true, data: messageWithSender });
  } catch (error) {
    next(error);
  }
};

// Update message (admin or sender)
export const updateMessage = async (req, res, next) => {
  try {
    const { id } = req.params; // message id
    const message = await Message.findByPk(id);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }
    if (req.user.role !== "admin" && message.sender_id !== req.user.user_id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    let { content, message_type } = req.body;
    // Handle image upload
    let imagePath = message.image;
    if (req.file) {
      // Delete old image if exists
      if (message.image) {
        const oldImagePath = path.join(__dirname, "../uploads", message.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = handleImageUpload(req);
    }
    if (!content && !imagePath) {
      return res.status(400).json({
        success: false,
        message: "Message must have content or image",
      });
    }
    if (!message_type) {
      if (content && imagePath) message_type = "text_image";
      else if (content) message_type = "text";
      else message_type = "image";
    }
    await message.update({ content, image: imagePath, message_type });
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "email", "avatar", "role"],
        },
      ],
    });
    res.json({ success: true, data: messageWithSender });
  } catch (error) {
    next(error);
  }
};

// Delete message (admin or sender)
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params; // message id
    const message = await Message.findByPk(id);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }
    if (req.user.role !== "admin" && message.sender_id !== req.user.user_id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    // Delete image if exists
    if (message.image) {
      const imagePath = path.join(__dirname, "../uploads", message.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await message.destroy();
    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};
