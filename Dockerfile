# Stage 1: Install dependencies
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Build the app
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Disable Next telemetry
ENV NEXT_TELEMETRY_DISABLED=1
# Generate prisma client
RUN npx prisma generate
# Build Next.js application
RUN npm run build

# Stage 3: Production runner
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npm run start"]
