import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { subscribe, unsubscribe } from "../lib/eventBus.js";

const router = Router();

router.get("/", authenticate, (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write(": connected\n\n");
  subscribe(res);

  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 30_000);
  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe(res);
  });
});

export default router;
