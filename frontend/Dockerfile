# NOVE Studio — Next.js frontend (monorepo workspace)
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend ./frontend
RUN npm ci && npm run build -w nove-frontend

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm ci -w nove-frontend --omit=dev && npm cache clean --force
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public
WORKDIR /app/frontend
ENV PORT=3000
EXPOSE 3000
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
