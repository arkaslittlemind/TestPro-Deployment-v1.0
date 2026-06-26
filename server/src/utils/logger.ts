import pino from "pino";

// Check if we are running on the EC2 server or locally
const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  // Default to 'info', but allow the environment to override it
  level: process.env.LOG_LEVEL || "info",

  // Use pino-pretty for human-readable logs locally.
  // In production, output raw JSON for performance and searchability.
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      },

  // Optional: Add global metadata to every single log
  base: {
    service: "testpro-api",
  },
});

export default logger;
