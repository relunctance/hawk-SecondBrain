# Dockerfile — hawk-SecondBrain
# Multi-stage build for hawk-SecondBrain v0.1
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

# ============================================================

FROM node:20-alpine

WORKDIR /app

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy source for hooks (capture, recall, dream handlers)
COPY src/hooks ./src/hooks
COPY src/skills ./src/skills
COPY src/report ./src/report
COPY src/config.ts ./src/config.ts
COPY src/types.ts ./src/types.ts
COPY src/client.ts ./src/client.ts

# Copy config and scripts
COPY config/ ./config/
COPY scripts/ ./scripts/

# Create hawk data dir
RUN mkdir -p /app/.hawk/reports && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Default: run noop server (hooks are invoked by hawk-memory via HTTP callbacks)
# For standalone mode: CMD ["node", "dist/src/index.js"]
CMD ["node", "-e", "console.log('hawk-SecondBrain ready. Hooks invoked via HTTP callbacks from hawk-memory.')"]
