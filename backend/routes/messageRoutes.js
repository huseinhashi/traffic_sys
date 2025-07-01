import express from "express";
import {
  getMessagesByConversation,
  createMessage,
  updateMessage,
  deleteMessage,
} from "../controllers/messageController.js";
import { authenticate } from "../middlewares/authmiddleware.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { messageSchema } from "../validators/validator.js";
import multer from "multer";

const router = express.Router();

// Configure multer for handling message image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// All routes require authentication
router.use(authenticate);

// List messages for a conversation
router.get("/conversations/:id/messages", getMessagesByConversation);

// Create message in a conversation
router.post(
  "/conversations/:id/messages",
  upload.single("image"),
  validate(messageSchema),
  createMessage
);

// Update message
router.put(
  "/messages/:id",
  upload.single("image"),
  validatePartial(messageSchema),
  updateMessage
);

// Delete message
router.delete("/messages/:id", deleteMessage);

export default router;
