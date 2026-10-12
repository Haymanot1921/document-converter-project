FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv libreoffice-writer libreoffice-impress \
    fonts-liberation fonts-dejavu-core && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/src ./src
COPY conversion-engine ./conversion-engine
RUN python3 -m venv /opt/venv \
 && /opt/venv/bin/pip install --no-cache-dir -r /app/conversion-engine/requirements.txt
ENV PATH="/opt/venv/bin:${PATH}"
ENV PYTHON_BIN=python3
EXPOSE 5000
CMD ["node", "src/server.js"]
