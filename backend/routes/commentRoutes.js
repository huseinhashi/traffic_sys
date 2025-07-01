import express from "express";
import {
  getCommentsByJamPost,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Get comments for a jam post
router.get("/jam-posts/:id/comments", authenticate, getCommentsByJamPost);

// Add a comment to a jam post
router.post("/jam-posts/:id/comments", authenticate, addComment);

// Update a comment (admin and owner only)
router.put("/comments/:id", authenticate, updateComment);

// Delete a comment (admin and owner only)
router.delete(
  "/comments/:id",
  authenticate,

  deleteComment
);

export default router;
