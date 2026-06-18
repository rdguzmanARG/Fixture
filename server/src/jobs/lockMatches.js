import cron from "node-cron";
import { lockStartedMatches } from "../services/matchSync.js";
const isDev = process.env.NODE_ENV === "development";

cron.schedule("*/5 * * * *", async () => {
  try {
    if (!isDev) await lockStartedMatches();
  } catch (err) {
    console.error("[lock] Cron error:", err.message);
  }
});

console.log("[lock] Match lock scheduled (every 5 minutes)");
