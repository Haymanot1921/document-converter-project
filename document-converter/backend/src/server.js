const fs = require("node:fs/promises");
const app = require("./app");
const { port, uploadDir, outputDir } = require("./config");

async function start() {
  await Promise.all([
    fs.mkdir(uploadDir, { recursive: true }),
    fs.mkdir(outputDir, { recursive: true })
  ]);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Document Converter API listening on ${port}`);
  });
}

start().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
