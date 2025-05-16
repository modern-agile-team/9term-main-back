# 빌드 스테이지
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci 

COPY . .
RUN npm run build
RUN npx prisma generate

# 실행 스테이지
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "dist/main.js"]

