import cron from "node-cron";
import { syncMatchResults } from "../services/matchSync.js";
const isProd = process.env.NODE_ENV === "production";

cron.schedule("*/5 * * * *", async () => {
  try {
    if (isProd) await syncMatchResults();
  } catch (err) {
    console.error("[sync] Cron error:", err.message);
  }
});

console.log("[sync] Match result sync scheduled (every 5 minutes)");
