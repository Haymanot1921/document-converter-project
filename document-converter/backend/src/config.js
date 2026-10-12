const path = require("node:path");
const fs = require("node:fs");

const root = process.cwd();
const asPath = (value, fallback) => path.resolve(root, value || fallback);
const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 20);
const localPython = process.platform === "win32"
  ? path.resolve(root, ".venv", "Scripts", "python.exe")
  : path.resolve(root, ".venv", "bin", "python");
const defaultPythonBin = process.platform === "win32" ? "py" : "python3";

if (!Number.isFinite(maxFileSizeMb) || maxFileSizeMb < 1 || maxFileSizeMb > 100) {
  throw new Error("MAX_FILE_SIZE_MB must be between 1 and 100");
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
  conversionTimeoutMs: Number(process.env.CONVERSION_TIMEOUT_MS || 120000),
  pythonBin: process.env.PYTHON_BIN || (fs.existsSync(localPython) ? localPython : defaultPythonBin),
  uploadDir: asPath(process.env.UPLOAD_DIR, "./tmp/uploads"),
  outputDir: asPath(process.env.OUTPUT_DIR, "./tmp/outputs"),
  workerDir: path.resolve(__dirname, "../../conversion-engine")
};
