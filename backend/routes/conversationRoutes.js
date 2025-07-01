import express from "express";
import {
  getAllConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation,
} from "../controllers/conversationController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { conversationSchema } from "../validators/validator.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// List all conversations (admin: all, user: only theirs)
router.get("/", getAllConversations);

// Get single conversation (admin or participant)
router.get("/:id", getConversationById);

// Create conversation
router.post("/", validate(conversationSchema), createConversation);

// Update conversation (admin only)
router.put(
  "/:id",
  restrictTo("admin"),
  validatePartial(conversationSchema),
  updateConversation
);

// Delete conversation (admin or participant)
router.delete("/:id", deleteConversation);

export default router;
