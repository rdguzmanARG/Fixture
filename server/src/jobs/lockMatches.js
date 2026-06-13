import cron from "node-cron";
import { lockStartedMatches } from "../services/matchSync.js";
const isProd = process.env.NODE_ENV === "production";

cron.schedule("*/5 * * * *", async () => {
  try {
    if (isProd) await lockStartedMatches();
  } catch (err) {
    console.error("[lock] Cron error:", err.message);
  }
});

console.log("[lock] Match lock scheduled (every 5 minutes)");
