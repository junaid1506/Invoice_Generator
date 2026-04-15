import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import configRoute from "./routes/configRoute.js";
import invoicesRoutes from "./routes/invoices.js";
import usersRoutes from "./routes/users.js";
import logsRoutes from "./routes/logs.js";
import { APP_NAME } from "./config.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, app: APP_NAME }));

app.use("/api/config", configRoute);
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/logs", logsRoutes);

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || "Admin";
  if (!email || !password) return;
  const count = await User.countDocuments();
  if (count > 0) return;
  const hash = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email: email.toLowerCase().trim(),
    password: hash,
    role: "admin",
  });
  console.log(`Seeded admin user: ${email}`);
}

const port = Number(process.env.PORT) || 5000;
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET");
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(async () => {
    console.log("MongoDB connected");
    await seedAdmin();
    app.listen(port, () => console.log(`API http://localhost:${port}`));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
