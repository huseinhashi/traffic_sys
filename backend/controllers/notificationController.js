import Notification from "../models/notifications.model.js";
import User from "../models/users.model.js";
import JamPost from "../models/jamPosts.model.js";
import { Op } from "sequelize";

// Create notification
export const createNotification = async (req, res, next) => {
  try {
    const { jam_post_id, message, type, distance } = req.body;
    const userId = req.user.user_id;

    // Duplicate check
    const exists = await Notification.findOne({
      where: { user_id: userId, jam_post_id, type }
    });
    if (exists) {
      return res.status(200).json({
        success: true,
        message: "Notification already exists",
        data: exists,
      });
    }

    const notification = await Notification.create({
      user_id: userId,
      jam_post_id,
      message,
      type,
      distance,
      is_read: false,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// Get all notifications for current user
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
      include: [
        { 
          model: JamPost, 
          as: "jamPost",
          attributes: ["id", "latitude", "longitude", "note", "level", "image"] 
        }
      ],
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// Get notification by ID
export const getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const notification = await Notification.findOne({
      where: { 
        id,
        user_id: userId 
      },
      include: [
        { 
          model: JamPost, 
          as: "jamPost",
          attributes: ["id", "latitude", "longitude", "note", "level", "image"] 
        }
      ],
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// Update notification
export const updateNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const { message, type, is_read, distance } = req.body;

    const notification = await Notification.findOne({
      where: { 
        id,
        user_id: userId 
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.update({
      message,
      type,
      is_read,
      distance,
    });

    res.status(200).json({
      success: true,
      message: "Notification updated successfully",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const notification = await Notification.findOne({
      where: { 
        id,
        user_id: userId 
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.destroy();

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get notifications by type
export const getNotificationsByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const userId = req.user.user_id;

    const notifications = await Notification.findAll({
      where: {
        user_id: userId,
        type,
      },
      order: [["createdAt", "DESC"]],
      include: [
        { 
          model: JamPost, 
          as: "jamPost",
          attributes: ["id", "latitude", "longitude", "note", "level", "image"] 
        }
      ],
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// Get unread notifications
export const getUnreadNotifications = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const notifications = await Notification.findAll({
      where: {
        user_id: userId,
        is_read: false,
      },
      order: [["createdAt", "DESC"]],
      include: [
        { 
          model: JamPost, 
          as: "jamPost",
          attributes: ["id", "latitude", "longitude", "note", "level", "image"] 
        }
      ],
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const notification = await Notification.findOne({
      where: { 
        id,
        user_id: userId 
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.update({ is_read: true });

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

// Create notification for nearby jam
export const createNearbyJamNotification = async (req, res, next) => {
  try {
    const { jam_post_id, user_latitude, user_longitude, radius = 5000 } = req.body;
    const userId = req.user.user_id;

    // Get the jam post details
    const jamPost = await JamPost.findByPk(jam_post_id);
    if (!jamPost) {
      return res.status(404).json({
        success: false,
        message: "Jam post not found",
      });
    }

    // Calculate distance between user and jam
    const distance = calculateDistance(
      user_latitude,
      user_longitude,
      jamPost.latitude,
      jamPost.longitude
    );

    // Only create notification if jam is within radius
    if (distance <= radius) {
      // Duplicate check
      const exists = await Notification.findOne({
        where: { user_id: userId, jam_post_id, type: "nearby_jam" }
      });
      if (exists) {
        return res.status(200).json({
          success: true,
          message: "Notification already exists",
          data: exists,
        });
      }

      const message = `New traffic jam detected ${(distance / 1000).toFixed(1)}km away - ${jamPost.level} severity`;
      
      const notification = await Notification.create({
        user_id: userId,
        jam_post_id,
        message,
        type: "nearby_jam",
        distance,
        is_read: false,
      });

      res.status(201).json({
        success: true,
        message: "Nearby jam notification created",
        data: notification,
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Jam is outside notification radius",
        distance,
        radius,
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const count = await Notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
} 