# Use the official Bun image
FROM oven/bun:1 as base

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY core/package.json ./core/

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Generate Prisma Client
RUN cd backend && bunx prisma generate

# Build frontend
RUN bun run --cwd frontend build

# Final stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built assets and dependencies from base
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/core ./core
COPY --from=base /app/frontend/dist ./frontend/dist
COPY --from=base /app/backend ./backend
COPY --from=base /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start command
CMD ["sh", "-c", "cd backend && bunx prisma migrate deploy && bun src/index.ts"]
