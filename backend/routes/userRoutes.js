import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateCurrentUser,
  getPublicUsers,
} from "../controllers/userController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { userSchema } from "../validators/validator.js";
import multer from "multer";

const router = express.Router();

// Configure multer for handling avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Protected routes
router.use(authenticate);

// User profile routes (for authenticated users)
router.get("/profile", getCurrentUser);
router.put(
  "/profile",
  upload.single("avatar"),
  validatePartial(userSchema.omit({ role: true })),
  updateCurrentUser
);
router.route("/public").get(getPublicUsers);

// Admin-only routes
router
  .route("/")
  .get(restrictTo("admin"), getAllUsers)
  .post(
    restrictTo("admin"),
    upload.single("avatar"),
    validate(userSchema),
    createUser
  );

router
  .route("/:id")
  .get(restrictTo("admin"), getUserById)
  .put(
    restrictTo("admin"),
    upload.single("avatar"),
    validatePartial(userSchema),
    updateUser
  )
  .delete(restrictTo("admin"), deleteUser);

export default router;
