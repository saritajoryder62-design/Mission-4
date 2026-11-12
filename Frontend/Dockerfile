# Node 24 on small Alpine Linux
FROM node:24-alpine

# Folder inside the container where the app lives
WORKDIR /app

# Copy package files first so Docker can cache the install step
COPY package*.json ./
RUN npm ci

# Copy the rest of the code (.dockerignore skips node_modules and dist)
COPY . .

EXPOSE 5173
# --host lets your browser reach Vite from outside the container
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]
