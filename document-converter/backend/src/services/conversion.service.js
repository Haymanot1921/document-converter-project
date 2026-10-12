const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");
const { conversionTimeoutMs, pythonBin, workerDir, outputDir } = require("../config");

function run(command, args, timeoutMs = conversionTimeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"], shell: false });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(Object.assign(new Error("Conversion timed out"), { statusCode: 504 }));
    }, timeoutMs);
    child.stderr.on("data", (chunk) => {
      if (stderr.length < 4000) stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      if (error.code === "ENOENT") {
        const runtime = command === pythonBin ? "Python" : "LibreOffice";
        const installHint = runtime === "Python"
          ? "Create backend\\.venv and install conversion-engine\\requirements.txt."
          : "Install LibreOffice and make sure soffice is on PATH.";
        return reject(Object.assign(
          new Error(`${runtime} executable "${command}" was not found. ${installHint}`),
          { statusCode: 503 }
        ));
      }
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve();
      const missingModule = command === pythonBin
        ? stderr.match(/No module named ['"]([^'"]+)['"]/)
        : null;
      if (missingModule) {
        return reject(Object.assign(
          new Error(`Python dependency "${missingModule[1]}" is missing. Install conversion-engine\\requirements.txt in the backend Python environment.`),
          { statusCode: 503 }
        ));
      }
      reject(new Error(`Conversion engine failed (${code}): ${stderr.slice(-1500)}`));
    });
  });
}

async function ensureFile(filePath) {
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat?.isFile() || stat.size === 0) {
    throw new Error("Conversion did not produce a valid output file");
  }
}

async function convert({ kind, inputPath }) {
  await fs.mkdir(outputDir, { recursive: true });
  const id = randomUUID();
  let outputPath;

  if (kind === "pdf-to-word") {
    outputPath = path.join(outputDir, `${id}.docx`);
    await run(pythonBin, [path.join(workerDir, "pdf_to_word.py"), inputPath, outputPath]);
  } else if (kind === "word-to-pdf") {
    const profile = `file://${path.join(outputDir, `lo-profile-${id}`).replace(/\\/g, "/")}`;
    await run("soffice", [
      `-env:UserInstallation=${profile}`,
      "--headless", "--convert-to", "pdf",
      "--outdir", outputDir, inputPath
    ]);
    outputPath = path.join(outputDir, `${path.parse(inputPath).name}.pdf`);
    // LibreOffice output uses input basename; move it to a random name to avoid collisions.
    const uniqueOutput = path.join(outputDir, `${id}.pdf`);
    await fs.rename(outputPath, uniqueOutput);
    outputPath = uniqueOutput;
  } else if (kind === "pdf-to-ppt") {
    outputPath = path.join(outputDir, `${id}.pptx`);
    await run(pythonBin, [path.join(workerDir, "pdf_to_ppt.py"), inputPath, outputPath]);
  } else {
    throw Object.assign(new Error("Unsupported conversion"), { statusCode: 400 });
  }

  await ensureFile(outputPath);
  return outputPath;
}

module.exports = { convert };
