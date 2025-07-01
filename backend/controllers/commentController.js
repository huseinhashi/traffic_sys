import { Comment, User, JamPost } from "../models/index.js";
import { Op } from "sequelize";

// Get comments for a jam post
export const getCommentsByJamPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if jam post exists
    const jamPost = await JamPost.findByPk(id);
    if (!jamPost) {
      return res.status(404).json({
        success: false,
        message: "Jam post not found",
      });
    }

    const comments = await Comment.findAndCountAll({
      where: { jam_post_id: id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "avatar", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Add isOwner flag for each comment
    const commentsWithOwnership = comments.rows.map((comment) => {
      const commentData = comment.toJSON();
      commentData.isOwner =
        comment.user_id === req.user.user_id || req.user.role === "admin";
      return commentData;
    });

    res.json({
      success: true,
      data: commentsWithOwnership,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(comments.count / limit),
        totalItems: comments.count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Add a comment to a jam post
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, user_id } = req.body;

    // Check if jam post exists
    const jamPost = await JamPost.findByPk(id);
    if (!jamPost) {
      return res.status(404).json({
        success: false,
        message: "Jam post not found",
      });
    }

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    // Determine user_id - admin can specify, regular users use their own ID
    let commentUserId = req.user.user_id;
    if (req.user.role === "admin" && user_id) {
      // Verify the specified user exists
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Specified user not found",
        });
      }
      commentUserId = user_id;
    }

    const comment = await Comment.create({
      jam_post_id: id,
      user_id: commentUserId,
      content: content.trim(),
    });

    // Fetch the comment with user details
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "avatar", "role"],
        },
      ],
    });

    const commentData = commentWithUser.toJSON();
    commentData.isOwner = true;

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: commentData,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, user_id } = req.body;

    const comment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check permissions - only admin or comment owner can update
    if (req.user.role !== "admin" && comment.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this comment",
      });
    }

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    // Update user_id if admin is changing it
    if (req.user.role === "admin" && user_id && user_id !== comment.user_id) {
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Specified user not found",
        });
      }
      comment.user_id = user_id;
    }

    comment.content = content.trim();
    await comment.save();

    const commentData = comment.toJSON();
    commentData.isOwner =
      comment.user_id === req.user.user_id || req.user.role === "admin";

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: commentData,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check permissions - only admin or comment owner can delete
    if (req.user.role !== "admin" && comment.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this comment",
      });
    }

    await comment.destroy();

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
