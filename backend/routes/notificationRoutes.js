import express from "express";
import { authenticate } from "../middlewares/authmiddleware.js";
import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  getNotificationsByType,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNearbyJamNotification,
  getUnreadNotificationCount,
} from "../controllers/notificationController.js";

const router = express.Router();

// All routes are protected with authentication
router.use(authenticate);

// Create notification
router.post("/", createNotification);

// Get all notifications for current user
router.get("/", getNotifications);

// Get unread notification count
router.get("/count", getUnreadNotificationCount);

// Get notification by ID
router.get("/:id", getNotificationById);

// Update notification
router.put("/:id", updateNotification);

// Delete notification
router.delete("/:id", deleteNotification);

// Get notifications by type
router.get("/type/:type", getNotificationsByType);

// Get unread notifications
router.get("/unread", getUnreadNotifications);

// Mark notification as read
router.patch("/:id/read", markNotificationAsRead);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationsAsRead);

// Create notification for nearby jam
router.post("/nearby-jam", createNearbyJamNotification);

export default router; 