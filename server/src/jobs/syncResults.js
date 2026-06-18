import cron from "node-cron";
import { syncMatchResults } from "../services/matchSync.js";
const isDev = process.env.NODE_ENV === "development";

cron.schedule("*/30 * * * * *", async () => {
  try {
    if (!isDev) await syncMatchResults();
  } catch (err) {
    console.error("[sync] Cron error:", err.message);
  }
});

console.log("[sync] Match result sync scheduled (every 30 seconds)");
