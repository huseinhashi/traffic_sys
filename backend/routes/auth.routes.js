import express from "express";
import {
  loginUser,
  loginAdmin,
  registerUser,
} from "../controllers/authController.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { loginSchema, userSchema } from "../validators/validator.js";
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

// Public authentication routes
router.post(
  "/register",
  upload.single("avatar"),
  validate(userSchema.omit({ role: true })),
  registerUser
);
router.post("/login", validate(loginSchema), loginUser);
router.post("/admin/login", validate(loginSchema), loginAdmin);

export default router;
