import express from "express";
import userRoutes from "./userRoutes.js";
import authRoutes from "./auth.routes.js";
import jamPostRoutes from "./jamPostRoutes.js";
import commentRoutes from "./commentRoutes.js";
import reactionRoutes from "./reactionRoutes.js";
import conversationRoutes from "./conversationRoutes.js";
import messageRoutes from "./messageRoutes.js";

const router = express.Router();

// Authentication routes
router.use("/auth", authRoutes);

// Resource routes
router.use("/users", userRoutes);
router.use("/jam-posts", jamPostRoutes);
router.use("/", commentRoutes);
router.use("/", reactionRoutes);
router.use("/conversations", conversationRoutes);
router.use("/", messageRoutes);

export default router;
