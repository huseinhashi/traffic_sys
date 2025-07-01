import { Reaction, User, JamPost } from "../models/index.js";

// Add a reaction to a jam post
export const addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction_type } = req.body;

    // Check if jam post exists
    const jamPost = await JamPost.findByPk(id);
    if (!jamPost) {
      return res.status(404).json({
        success: false,
        message: "Jam post not found",
      });
    }

    // Validate reaction type
    const validReactionTypes = ["like", "dislike", "helpful", "accurate"];
    if (!validReactionTypes.includes(reaction_type)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reaction type. Must be one of: like, dislike, helpful, accurate",
      });
    }

    // Check if user already has a reaction on this jam post
    const existingReaction = await Reaction.findOne({
      where: {
        jam_post_id: id,
        user_id: req.user.user_id,
      },
    });

    if (existingReaction) {
      // Update existing reaction
      existingReaction.reaction_type = reaction_type;
      await existingReaction.save();
    } else {
      // Create new reaction
      await Reaction.create({
        jam_post_id: id,
        user_id: req.user.user_id,
        reaction_type,
      });
    }

    // Get updated reaction counts
    const reactionCounts = await Reaction.findAll({
      where: { jam_post_id: id },
      attributes: [
        "reaction_type",
        [Reaction.sequelize.fn("COUNT", Reaction.sequelize.col("id")), "count"],
      ],
      group: ["reaction_type"],
    });

    // Get user's current reaction
    const userReaction = await Reaction.findOne({
      where: {
        jam_post_id: id,
        user_id: req.user.user_id,
      },
      attributes: ["reaction_type"],
    });

    // Format reaction counts
    const formattedCounts = {};
    reactionCounts.forEach((reaction) => {
      formattedCounts[reaction.reaction_type] = parseInt(
        reaction.dataValues.count
      );
    });

    res.json({
      success: true,
      message: "Reaction added successfully",
      data: {
        reactionCounts: formattedCounts,
        userReaction: userReaction ? userReaction.reaction_type : null,
      },
    });
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Remove a reaction from a jam post
export const removeReaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if jam post exists
    const jamPost = await JamPost.findByPk(id);
    if (!jamPost) {
      return res.status(404).json({
        success: false,
        message: "Jam post not found",
      });
    }

    // Find and delete user's reaction
    const reaction = await Reaction.findOne({
      where: {
        jam_post_id: id,
        user_id: req.user.user_id,
      },
    });

    if (reaction) {
      await reaction.destroy();
    }

    // Get updated reaction counts
    const reactionCounts = await Reaction.findAll({
      where: { jam_post_id: id },
      attributes: [
        "reaction_type",
        [Reaction.sequelize.fn("COUNT", Reaction.sequelize.col("id")), "count"],
      ],
      group: ["reaction_type"],
    });

    // Format reaction counts
    const formattedCounts = {};
    reactionCounts.forEach((reaction) => {
      formattedCounts[reaction.reaction_type] = parseInt(
        reaction.dataValues.count
      );
    });

    res.json({
      success: true,
      message: "Reaction removed successfully",
      data: {
        reactionCounts: formattedCounts,
        userReaction: null,
      },
    });
  } catch (error) {
    console.error("Error removing reaction:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get reactions for a jam post
export const getReactionsByJamPost = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if jam post exists
    const jamPost = await JamPost.findByPk(id);
    if (!jamPost) {
      return res.status(404).json({
        success: false,
        message: "Jam post not found",
      });
    }

    // Get reaction counts
    const reactionCounts = await Reaction.findAll({
      where: { jam_post_id: id },
      attributes: [
        "reaction_type",
        [Reaction.sequelize.fn("COUNT", Reaction.sequelize.col("id")), "count"],
      ],
      group: ["reaction_type"],
    });

    const counts = {};
    reactionCounts.forEach((r) => {
      counts[r.reaction_type] = parseInt(r.dataValues.count);
    });

    // Get user's reaction if authenticated
    let userReaction = null;
    if (req.user) {
      const userReactionRecord = await Reaction.findOne({
        where: {
          jam_post_id: id,
          user_id: req.user.user_id,
        },
      });
      if (userReactionRecord) {
        userReaction = userReactionRecord.reaction_type;
      }
    }

    res.json({
      success: true,
      data: {
        reactionCounts: counts,
        userReaction,
      },
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
