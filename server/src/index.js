import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { join } from "path";

import authRouter from "./routes/auth.js";
import matchesRouter from "./routes/matches.js";
import predictionsRouter from "./routes/predictions.js";
import "./jobs/syncResults.js";
//import './jobs/lockMatches.js';

const clientDist = join(process.cwd(), "client/dist");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/predictions", predictionsRouter);

app.use(express.static(clientDist));
app.get("*", (_req, res) => res.sendFile(join(clientDist, "index.html")));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
