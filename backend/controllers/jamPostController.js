import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Op } from "sequelize";
import { JamPost, Comment, Reaction, User } from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to handle image upload
const handleImageUpload = (req) => {
  let imagePath = null;
  if (req.file) {
    const uploadsDir = path.join(__dirname, "../uploads/jam-posts");

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileExt = path.extname(req.file.originalname);
    const fileName = `jam_${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    // Write file to uploads directory
    fs.writeFileSync(filePath, req.file.buffer);
    imagePath = `jam-posts/${fileName}`;
  }
  return imagePath;
};

// Helper function to get jam post with counts and user info
const getJamPostWithDetails = async (jamPost) => {
  const plainJamPost = jamPost.get({ plain: true });

  // Get comment count
  const commentCount = await Comment.count({
    where: { jam_post_id: jamPost.id },
  });

  // Get reaction counts by type
  const reactions = await Reaction.findAll({
    where: { jam_post_id: jamPost.id },
    attributes: [
      "reaction_type",
      [
        JamPost.sequelize.fn("COUNT", JamPost.sequelize.col("reaction_type")),
        "count",
      ],
    ],
    group: ["reaction_type"],
  });

  const reactionCounts = {
    like: 0,
    dislike: 0,
    helpful: 0,
    accurate: 0,
  };

  reactions.forEach((reaction) => {
    reactionCounts[reaction.reaction_type] = parseInt(reaction.get("count"));
  });

  // Get user info
  const user = await User.findByPk(jamPost.user_id, {
    attributes: ["id", "name", "email", "avatar", "role"],
  });

  return {
    ...plainJamPost,
    user: user ? user.get({ plain: true }) : null,
    commentCount,
    reactionCounts,
    totalReactions: Object.values(reactionCounts).reduce(
      (sum, count) => sum + count,
      0
    ),
  };
};

// Helper to get date range from timeFilter
const getTimeFilterRange = (timeFilter) => {
  const now = new Date();
  let from = null;
  switch (timeFilter) {
    case "lastHour":
      from = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "last5Hours":
      from = new Date(now.getTime() - 5 * 60 * 60 * 1000);
      break;
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "thisWeek":
      const day = now.getDay();
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      break;
    default:
      from = null;
  }
  return from;
};

// Get all jam posts (Admin only)
export const getAllJamPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, level, search, timeFilter } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (level && level !== "all") {
      whereClause.level = level;
    }
    if (search) {
      whereClause.note = {
        [Op.like]: `%${search}%`,
      };
    }
    if (timeFilter) {
      const from = getTimeFilterRange(timeFilter);
      if (from) {
        whereClause.createdAt = { [Op.gte]: from };
      }
    }

    const jamPosts = await JamPost.findAndCountAll({
      where: whereClause,
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

    // Get counts for each jam post
    const jamPostsWithDetails = await Promise.all(
      jamPosts.rows.map(async (jamPost) => {
        return await getJamPostWithDetails(jamPost);
      })
    );

    res.json({
      success: true,
      data: jamPostsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(jamPosts.count / limit),
        totalItems: jamPosts.count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get jam posts for regular users (their own posts + all public posts)
export const getUserJamPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, level, search, timeFilter } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.user_id;

    // Build where clause - user can see their own posts and all other posts
    const whereClause = {};
    if (level && level !== "all") {
      whereClause.level = level;
    }
    if (search) {
      whereClause.note = {
        [Op.like]: `%${search}%`,
      };
    }
    if (timeFilter) {
      const from = getTimeFilterRange(timeFilter);
      if (from) {
        whereClause.createdAt = { [Op.gte]: from };
      }
    }

    const jamPosts = await JamPost.findAndCountAll({
      where: whereClause,
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

    // Get counts and user's reaction for each jam post
    const jamPostsWithDetails = await Promise.all(
      jamPosts.rows.map(async (jamPost) => {
        const details = await getJamPostWithDetails(jamPost);

        // Check if current user has reacted to this post
        const userReaction = await Reaction.findOne({
          where: {
            jam_post_id: jamPost.id,
            user_id: userId,
          },
        });

        return {
          ...details,
          userReaction: userReaction ? userReaction.reaction_type : null,
          isOwner: jamPost.user_id === userId,
        };
      })
    );

    res.json({
      success: true,
      data: jamPostsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(jamPosts.count / limit),
        totalItems: jamPosts.count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single jam post by ID
export const getJamPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const jamPost = await JamPost.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "avatar", "role"],
        },
      ],
    });

    if (!jamPost) {
      return res.status(404).json({
        success: false,
        message: "Jam post not found",
      });
    }

    const jamPostWithDetails = await getJamPostWithDetails(jamPost);

    // Check if current user has reacted to this post
    const userReaction = await Reaction.findOne({
      where: {
        jam_post_id: jamPost.id,
        user_id: userId,
      },
    });

    const result = {
      ...jamPostWithDetails,
      userReaction: userReaction ? userReaction.reaction_type : null,
      isOwner: jamPost.user_id === userId,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Create new jam post
export const createJamPost = async (req, res, next) => {
  try {
    const { latitude, longitude, note, level = "medium", user_id } = req.body;
    let userId = req.user.user_id;

    // If admin is specifying a user_id, use that instead
    if (req.user.role === "admin" && user_id) {
      // Verify the specified user exists
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Specified user not found",
        });
      }
      userId = user_id;
    }

    // Handle image upload
    const imagePath = handleImageUpload(req);

    const jamPost = await JamPost.create({
      user_id: userId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      note,
      image: imagePath,
      level,
    });

    const jamPostWithDetails = await getJamPostWithDetails(jamPost);

    res.status(201).json({
      success: true,
      data: jamPostWithDetails,
      message: "Jam post created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update jam post
export const updateJamPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, note, level, user_id } = req.body;
    const userId = req.user.user_id;

    const jamPost = await JamPost.findByPk(id);
    if (!jamPost) {
      return res.status(404).json({
        success: false,
        message: "Jam post not found",
      });
    }

    // Check if user owns the post or is admin
    if (jamPost.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only update your own jam posts",
      });
    }

    // Handle image upload if new image is provided
    let imagePath = jamPost.image;
    if (req.file) {
      // Delete old image if exists
      if (jamPost.image) {
        const oldImagePath = path.join(__dirname, "../uploads", jamPost.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = handleImageUpload(req);
    }

    // Prepare update data
    const updateData = {
      latitude: latitude ? parseFloat(latitude) : jamPost.latitude,
      longitude: longitude ? parseFloat(longitude) : jamPost.longitude,
      note: note !== undefined ? note : jamPost.note,
      level: level || jamPost.level,
      image: imagePath,
    };

    // If admin is changing the user_id, verify the user exists
    if (req.user.role === "admin" && user_id && user_id !== jamPost.user_id) {
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Specified user not found",
        });
      }
      updateData.user_id = user_id;
    }

    // Update jam post
    await jamPost.update(updateData);

    const jamPostWithDetails = await getJamPostWithDetails(jamPost);

    res.json({
      success: true,
      data: jamPostWithDetails,
      message: "Jam post updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete jam post
export const deleteJamPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const jamPost = await JamPost.findByPk(id);
    if (!jamPost) {
      return res.status(404).json({
        success: false,
        message: "Jam post not found",
      });
    }

    // Check if user owns the post or is admin
    if (jamPost.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own jam posts",
      });
    }

    // Delete associated comments and reactions
    await Comment.destroy({ where: { jam_post_id: id } });
    await Reaction.destroy({ where: { jam_post_id: id } });

    // Delete image file if exists
    if (jamPost.image) {
      const imagePath = path.join(__dirname, "../uploads", jamPost.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete jam post
    await jamPost.destroy();

    res.json({
      success: true,
      message: "Jam post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get jam post statistics (Admin only)
export const getJamPostStats = async (req, res, next) => {
  try {
    const totalPosts = await JamPost.count();
    const totalComments = await Comment.count();
    const totalReactions = await Reaction.count();

    // Posts by level
    const postsByLevel = await JamPost.findAll({
      attributes: [
        "level",
        [
          JamPost.sequelize.fn("COUNT", JamPost.sequelize.col("level")),
          "count",
        ],
      ],
      group: ["level"],
    });

    // Reactions by type
    const reactionsByType = await Reaction.findAll({
      attributes: [
        "reaction_type",
        [
          Reaction.sequelize.fn(
            "COUNT",
            Reaction.sequelize.col("reaction_type")
          ),
          "count",
        ],
      ],
      group: ["reaction_type"],
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPosts = await JamPost.count({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
    });

    const recentComments = await Comment.count({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
    });

    res.json({
      success: true,
      data: {
        totalPosts,
        totalComments,
        totalReactions,
        postsByLevel: postsByLevel.map((item) => ({
          level: item.level,
          count: parseInt(item.get("count")),
        })),
        reactionsByType: reactionsByType.map((item) => ({
          type: item.reaction_type,
          count: parseInt(item.get("count")),
        })),
        recentActivity: {
          posts: recentPosts,
          comments: recentComments,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
