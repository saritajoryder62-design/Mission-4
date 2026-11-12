# Node 24 on small Alpine Linux
FROM node:24-alpine

# Folder inside the container where the app lives
WORKDIR /app

# Copy package files first so Docker can cache the install step
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the code (.dockerignore skips node_modules and .env)
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
