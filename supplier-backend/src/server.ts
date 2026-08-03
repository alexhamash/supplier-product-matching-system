import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import mainProductRoutes from "./routes/mainProductRoutes";
import supplierRoutes from "./routes/supplierRoutes";
import supplierProductRoutes from "./routes/supplierProductRoutes";
import matchingRoutes from "./routes/matchingRoutes";
import authRoutes from "./routes/authRoutes";
import { authMiddleware } from "./middlewares/authMiddleware";
import {
  notFoundHandler,
  globalErrorHandler,
} from "./middlewares/errorHandler";
import { prisma } from "./lib/prisma";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS Configuration ──────────────────────────────────────────────────────
// Must be registered before ANY route handlers to handle preflight OPTIONS
// requests with the proper Access-Control-* headers.
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Request Logger ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────────────────
// Must be defined before routes so it responds immediately without hitting the DB.
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
// Public auth routes (register / login) — no token required.
app.use("/api/auth", authRoutes);

// Protected routes — require a valid `Authorization: Bearer <token>` header.
app.use("/api/main-products", authMiddleware, mainProductRoutes);
app.use("/api/suppliers", authMiddleware, supplierRoutes);
app.use("/api/suppliers", authMiddleware, supplierProductRoutes);
app.use("/api/matching", authMiddleware, matchingRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Server Start ────────────────────────────────────────────────────────────
const start = async (): Promise<void> => {
  try {
    // Attempt to connect to the database; log a warning if it fails so the
    // server can still start for health-check / debugging purposes.
    await prisma.$connect();
    console.log('[server] Database connected successfully.');
  } catch (err) {
    console.error('[server] WARNING: Database connection failed — the server will start but DB-dependent routes will error.');
    console.error('[server] DB Error:', (err as Error).message);
  }

  app.listen(PORT, () => {
    console.log(`[server] Supplier API running on http://localhost:${PORT}`);
    console.log(`[server] Health check: http://localhost:${PORT}/api/health`);
  });
};

start();

export default app;
