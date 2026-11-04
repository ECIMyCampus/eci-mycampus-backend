FROM node:22-alpine AS builder
# Prisma necesita OpenSSL y la imagen alpine no lo trae.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY prisma ./prisma
RUN npm ci
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM builder AS production-deps
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=production-deps /app/package*.json ./
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]
