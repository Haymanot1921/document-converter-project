const express = require("express");
const path = require("node:path");
const fs = require("node:fs/promises");
async function fileTypeFromFile(filePath) {
  const module = await import("file-type");
  return module.fileTypeFromFile(filePath);
}
const { upload } = require("../middleware/upload");
const { convert } = require("../services/conversion.service");

const router = express.Router();
const definitions = {
  "pdf-to-word": { input: "pdf", output: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "converted.docx" },
  "word-to-pdf": { input: "docx", output: "pdf", mime: "application/pdf", label: "converted.pdf" },
  "pdf-to-ppt": { input: "pdf", output: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", label: "converted.pptx" }
};

router.post("/:kind", upload.single("file"), async (req, res, next) => {
  const inputPath = req.file?.path;
  let outputPath;
  try {
    const definition = definitions[req.params.kind];
    if (!definition) {
      if (inputPath) await fs.rm(inputPath, { force: true });
      return res.status(404).json({ error: "Unknown conversion type." });
    }
    if (!req.file) return res.status(400).json({ error: "Upload one file using the 'file' field." });

    const detected = await fileTypeFromFile(inputPath);
    const valid = definition.input === "pdf"
      ? detected?.mime === "application/pdf"
      : detected?.mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!valid) {
      return res.status(415).json({ error: `The uploaded file does not appear to be a valid ${definition.input.toUpperCase()} file.` });
    }

    outputPath = await convert({ kind: req.params.kind, inputPath });
    res.setHeader("Content-Type", definition.mime);
    res.setHeader("Content-Disposition", `attachment; filename="${definition.label}"`);
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(outputPath, async (error) => {
      await Promise.all([
        fs.rm(inputPath, { force: true }),
        outputPath ? fs.rm(outputPath, { force: true }) : Promise.resolve()
      ]);
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    await Promise.all([
      inputPath ? fs.rm(inputPath, { force: true }) : Promise.resolve(),
      outputPath ? fs.rm(outputPath, { force: true }) : Promise.resolve()
    ]);
    next(error);
  }
});

module.exports = router;
