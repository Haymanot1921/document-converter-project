const multer = require("multer");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { uploadDir, maxFileSizeBytes } = require("../config");

const allowed = new Set([".pdf", ".docx"]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeBytes, files: 1, fields: 0 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.has(ext)) return cb(Object.assign(new Error("Unsupported file type"), { statusCode: 415 }));
    cb(null, true);
  }
});

module.exports = { upload };
