import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";
import { logAction } from "../utils/logAction.js";
import { APP_NAME } from "../config.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

router.post("/register", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
    if (password !== req.body.confirmPassword) {
      return res.status(400).json({ message: "Passwords must match" });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hash,
      role: "user",
    });
    await logAction(
      user._id,
      "register",
      null,
      `New user registered: ${email}`,
    );
    const token = signToken(user);
    const u = user.toObject();
    delete u.password;
    res.status(201).json({ token, user: u, appName: APP_NAME });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    await logAction(user._id, "login", null, "User logged in");
    const token = signToken(user);
    const u = user.toObject();
    delete u.password;
    res.json({ token, user: u, appName: APP_NAME });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password").lean();
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json({ user, appName: APP_NAME });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/logout", authRequired, async (req, res) => {
  await logAction(req.userId, "logout", null, "User logged out");
  res.json({ ok: true });
});

export default router;
