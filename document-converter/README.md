# Document Converter

Production-oriented starter for PDF → Word, Word → PDF, and PDF → PowerPoint.

## Architecture
- `frontend/`: React + Vite UI
- `backend/`: Express API, upload validation, conversion orchestration, temporary files
- `conversion-engine/`: Python PDF→DOCX and PDF→PPTX workers
- Docker Compose: frontend, API, Redis (queue-ready). LibreOffice and Python are installed in the API image.

## Requirements
- Docker Desktop (recommended), or Node.js 20+, Python 3.11+, LibreOffice
- Docker Compose v2

## Run with Docker
```bash
docker compose up --build
```
Open http://localhost:5173. API health: http://localhost:5000/api/health

## Run locally
1. Backend:
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Install LibreOffice and Python 3.11+ first. In a separate terminal:
```bash
# Windows PowerShell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ..\conversion-engine\requirements.txt

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r ../conversion-engine/requirements.txt
```
Start the backend from the `backend` directory. It automatically uses `backend\.venv\Scripts\python.exe` on Windows when present; otherwise, it uses the `py` launcher. Set `PYTHON_BIN` to an explicit Python executable path if you use a different environment.
2. Frontend:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open the local URL printed by Vite (by default, `http://127.0.0.1:5300`). In development, the API allows loopback frontend origins on any port so Vite can select another available port.

## Converters
- PDF → Word: `pdf2docx`. Best for text-based PDFs. Scanned PDFs need OCR and may not retain layout perfectly.
- Word → PDF: LibreOffice headless. Fonts affect output fidelity.
- PDF → PowerPoint: one PDF page per slide as a high-resolution image. Appearance is preserved; slide content is not individually editable.

## Security notes before public deployment
This starter has upload limits, extension/MIME/signature checks, random filenames, CORS configuration, rate limiting, conversion timeouts, and temporary-file cleanup. For internet-facing production, add authentication/quotas, a queue-backed isolated worker container, antivirus scanning, egress restrictions, observability, durable job status, and a managed object store with short-lived download URLs. Do not run untrusted conversion files in a privileged container. Configure HTTPS and a strict `FRONTEND_URL`.

## Tests
```bash
cd backend
npm test
```
The tests cover health and validation paths. For full conversion integration tests, supply sample files and test in Docker with LibreOffice installed.
