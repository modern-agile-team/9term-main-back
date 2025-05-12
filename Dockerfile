FROM node:20-alpine

WORKDIR /app

# 의존성 설치 및 빌드 도구 설치
COPY package.json package-lock.json ./
RUN npm install

# 의존성 설치 및 bcrypt 재빌드
RUN apk add --no-cache --virtual .build-deps build-base python3 && \
    npm rebuild bcrypt --build-from-source  && \
    apk del .build-deps

# 나머지 파일 복사 및 prisma generate 실행
COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

