import express from "express";
import {
  getAllJamPosts,
  getUserJamPosts,
  getJamPostById,
  createJamPost,
  updateJamPost,
  deleteJamPost,
  getJamPostStats,
} from "../controllers/jamPostController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { jamPostSchema } from "../validators/validator.js";
import multer from "multer";

const router = express.Router();

// Configure multer for handling image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Protected routes - all routes require authentication
router.use(authenticate);

// Admin-only routes
router.get("/admin", restrictTo("admin"), getAllJamPosts);
router.get("/admin/stats", restrictTo("admin"), getJamPostStats);

// User routes (both admin and regular users can access)
router.get("/", getUserJamPosts);
router.get("/:id", getJamPostById);

// Create jam post (both admin and regular users)
router.post(
  "/",
  upload.single("image"),
  validate(jamPostSchema),
  createJamPost
);

// Update jam post (owner or admin)
router.put(
  "/:id",
  upload.single("image"),
  validatePartial(jamPostSchema),
  updateJamPost
);

// Delete jam post (owner or admin)
router.delete("/:id", deleteJamPost);

export default router;
