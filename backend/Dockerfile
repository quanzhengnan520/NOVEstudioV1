# NOVE Studio — backend API (monorepo workspace build)
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend ./backend
RUN npm ci && npm run build -w nove-backend

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm ci -w nove-backend --omit=dev && npm cache clean --force
COPY --from=build /app/backend/dist ./backend/dist
COPY backend/migrations ./backend/migrations
EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
