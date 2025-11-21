import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage.js";
import { pool } from "./db.js";
import {
  loginSchema,
  insertUserSchema,
  changePasswordSchema,
  insertSeriesSchema,
  updateSeriesSchema,
  insertMeasurementSchema,
  updateMeasurementSchema,
} from "../shared/schema.js";


const PgSession = connectPgSimple(session);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing! Add it to your .env file.");
}

const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized - Please login" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(sessionMiddleware);


  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: User created successfully
   */
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const hashed = await bcrypt.hash(parsed.password, 10);

      const user = await storage.createUser({
        username: parsed.username,
        password: hashed,
      });

      res.json({ id: user.id, username: user.username });
    } catch (err) {
      res.status(400).json({ message: "Registration failed" });
    }
  });

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Login successful
   */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const isValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

      req.session.userId = user.id;
      const { password, ...withoutPassword } = user;

      res.json(withoutPassword);
    } catch (err) {
      res.status(400).json({ message: "Login failed" });
    }
  });

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout current user
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Logout successful
   */
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get logged-in user
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Returns user
   */
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { password, ...rest } = user;
    res.json(rest);
  });

  /**
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     summary: Change password (admin only)
   *     tags: [Auth]
   */
  app.post("/api/auth/change-password", requireAdmin, async (req, res) => {
    try {
      const validated = changePasswordSchema.parse(req.body);
      const user = await storage.getUser(req.session.userId!);

      if (!user) return res.status(404).json({ message: "User not found" });

      const isValid = await bcrypt.compare(validated.currentPassword, user.password);
      if (!isValid) return res.status(401).json({ message: "Invalid current password" });

      const hashed = await bcrypt.hash(validated.newPassword, 10);
      await storage.updateUserPassword(user.id, hashed);

      res.json({ message: "Password updated" });
    } catch (err) {
      res.status(400).json({ message: "Password change failed" });
    }
  });


  /**
   * @swagger
   * /api/series:
   *   get:
   *     summary: Get all series
   *     tags: [Series]
   */
  app.get("/api/series", async (req, res) => {
    res.json(await storage.getAllSeries());
  });

  /**
   * @swagger
   * /api/series:
   *   post:
   *     summary: Create a new series (admin)
   *     tags: [Series]
   */
  app.post("/api/series", requireAdmin, async (req, res) => {
    try {
      const validated = insertSeriesSchema.parse(req.body);
      const created = await storage.createSeries(validated, req.session.userId!);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ message: "Failed to create series" });
    }
  });

  /**
   * @swagger
   * /api/series/{id}:
   *   put:
   *     summary: Update series
   *     tags: [Series]
   */
  app.put("/api/series/:id", requireAdmin, async (req, res) => {
    try {
      const validated = updateSeriesSchema.parse(req.body);
      const updated = await storage.updateSeries(req.params.id, validated);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Failed to update series" });
    }
  });

  /**
   * @swagger
   * /api/series/{id}:
   *   delete:
   *     summary: Delete series
   *     tags: [Series]
   */
  app.delete("/api/series/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSeries(req.params.id);
      res.json({ message: "Series deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete series" });
    }
  });


  /**
   * @swagger
   * /api/measurements:
   *   get:
   *     summary: Get all measurements
   *     tags: [Measurements]
   */
  app.get("/api/measurements", async (req, res) => {
    res.json(await storage.getAllMeasurements());
  });

  /**
   * @swagger
   * /api/measurements:
   *   post:
   *     summary: Create measurement (admin)
   *     tags: [Measurements]
   */
  app.post("/api/measurements", requireAdmin, async (req, res) => {
    try {
      const validated = insertMeasurementSchema.parse(req.body);
      const created = await storage.createMeasurement(validated, req.session.userId!);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ message: "Failed to create measurement" });
    }
  });

  /**
   * @swagger
   * /api/measurements/{id}:
   *   put:
   *     summary: Update measurement
   *     tags: [Measurements]
   */
  app.put("/api/measurements/:id", requireAdmin, async (req, res) => {
    try {
      const validated = updateMeasurementSchema.parse(req.body);
      const updated = await storage.updateMeasurement(req.params.id, validated);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Failed to update measurement" });
    }
  });

  /**
   * @swagger
   * /api/measurements/{id}:
   *   delete:
   *     summary: Delete measurement
   *     tags: [Measurements]
   */
  app.delete("/api/measurements/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteMeasurement(req.params.id);
      res.json({ message: "Measurement deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete measurement" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
