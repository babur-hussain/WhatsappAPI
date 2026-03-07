# Build Stage - v3: add apiKey/webhook fields to Factory schema
FROM node:20-alpine AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable corepack for pnpm support
RUN corepack enable pnpm

# First, install dependencies only to leverage Docker cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY shared/package.json shared/
COPY frontend/package.json frontend/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY shared/ ./shared/
COPY backend/ ./backend/

# Generate Prisma Client
WORKDIR /app/backend
RUN pnpm dlx prisma generate

# Build backend typescript
RUN pnpm run build

# Production Stage
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable pnpm
ENV NODE_ENV=production

# Copy built artifacts and runtime dependencies
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

# Intentionally skip dev dependencies for prod
RUN pnpm install --prod --frozen-lockfile

# Expose backend port
EXPOSE 8000
EXPOSE 5001

WORKDIR /app/backend

# Need Prisma CLI to run migrations in production
RUN pnpm install prisma

# Start the application
CMD ["pnpm", "run", "start:prod"]
