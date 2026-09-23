import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, getUsers } from "./src/db/users.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User auth sync
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || "unknown@user.com",
        req.user.name || undefined
      );
      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: error.message || "Failed to sync user" });
    }
  });

  // Get database users
  app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      const usersList = await getUsers();
      res.json(usersList);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  // Explicit download endpoint for Food handler skills and knowledge checklist
  const handleChecklistDownload = (req: express.Request, res: express.Response) => {
    const pubFile = path.join(process.cwd(), "public", "Food handler skills and knowledge checklist.pdf");
    const distFile = path.join(process.cwd(), "dist", "Food handler skills and knowledge checklist.pdf");
    const targetFile = fs.existsSync(pubFile) ? pubFile : distFile;
    res.download(targetFile, "Food handler skills and knowledge checklist.pdf");
  };

  app.get("/Food handler skills and knowledge checklist.pdf", handleChecklistDownload);
  app.get("/Food%20handler%20skills%20and%20knowledge%20checklist.pdf", handleChecklistDownload);
  app.get("/Food_handler_skills_and_knowledge_checklist.pdf", handleChecklistDownload);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
