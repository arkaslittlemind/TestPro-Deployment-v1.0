import app from "./app";
import logger from "./utils/logger";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`TestPro API is running on port ${PORT}`);
  logger.info("CI/CD Pipeline is LIVE! TestPro deployment successful!");
});

// Graceful Shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`\n[${signal}] Shutdown signal received. Intercepting...`);
  logger.info("Stopping server from accepting new connections...");

  // server.close() stops new traffic, but keeps the current ones alive
  server.close(() => {
    logger.info("All active payload comparisons finished. Safe to exit.");
    process.exit(0);
  });

  // Failsafe: If a diff takes abnormally long (e.g., stuck in an infinite loop),
  // force the server to shut down after 15 seconds so PM2 doesn't hang forever.
  setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1); // 1 means exit with an error
  }, 15000);
};

// SIGINT is what PM2 sends when you run `pm2 restart` or `pm2 stop`
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
// SIGTERM is what Ubuntu Linux sends when the actual EC2 server is shutting down
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
