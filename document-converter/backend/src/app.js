const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const conversionRoutes = require("./routes/conversion.routes");
const { frontendUrl } = require("./config");

const app = express();
const allowedOrigins = frontendUrl.split(",").map((value) => value.trim());
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    const isLocalDevelopmentOrigin = process.env.NODE_ENV !== "production"
      && /^http:\/\/(?:localhost|127(?:\.\d{1,3}){3})(?::\d+)?$/i.test(origin || "");
    callback(null, !origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin);
  }
}));
app.use(express.json({ limit: "32kb" }));
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/conversions", conversionRoutes);

app.use((err, _req, res, _next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large. Maximum size is configured by the server." });
  }
  if (err?.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err?.message === "Unsupported file type") {
    return res.status(415).json({ error: err.message });
  }
  console.error("Request failed:", err?.message || "unknown error");
  return res.status(500).json({ error: "The request could not be completed." });
});

module.exports = app;
