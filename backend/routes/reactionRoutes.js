import express from "express";
import {
  addReaction,
  removeReaction,
} from "../controllers/reactionController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Add a reaction to a jam post
router.post("/jam-posts/:id/reactions", authenticate, addReaction);

// Remove a reaction from a jam post
router.delete("/jam-posts/:id/reactions", authenticate, removeReaction);

export default router;
