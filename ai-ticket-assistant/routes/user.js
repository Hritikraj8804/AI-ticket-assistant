import express from "express";
import {
  getUsers,
  login,
  signup,
  updateUser,
  logout,
  createAdmin,
  createModerator,
  updateProfile,
  refreshOldTickets,
} from "../controllers/user.js";

import { authenticate } from "../middlewares/auth.js";
const router = express.Router();

router.post("/update-user", authenticate, updateUser);
router.get("/users", authenticate, getUsers);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.post("/create-admin", createAdmin);
router.post("/create-moderator", authenticate, createModerator);
router.post("/update-profile", authenticate, updateProfile);
router.post("/refresh-tickets", authenticate, refreshOldTickets);

export default router;
