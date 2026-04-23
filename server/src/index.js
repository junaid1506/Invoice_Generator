import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import configRoute from "./routes/configRoute.js";
import invoicesRoutes from "./routes/invoices.js";
import companyRoutes from "./routes/company.js";
import { APP_NAME } from "./config.js";

const app = express();
// const allowedOrigins = ["https://invoice-generator-beta-lyart.vercel.app"];
app.use(cors());

// 👇 ye line MUST hai
app.options("*", cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, app: APP_NAME }));

app.use("/api/config", configRoute);
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/company", companyRoutes);

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
    app.listen(port, () => console.log(`API http://localhost:${port}`));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
