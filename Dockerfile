# 빌드 스테이지
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci 

# 의존성 설치 및 bcrypt 재빌드
RUN apk add --no-cache --virtual .build-deps build-base python3 && \
    npm rebuild bcrypt --build-from-source  && \
    apk del .build-deps

COPY . .
RUN npm run build
RUN npx prisma generate

# 실행 스테이지
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main.js"]

