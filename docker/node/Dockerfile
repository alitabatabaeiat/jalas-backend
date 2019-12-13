FROM node:12.3.1-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run clean
RUN npm run build

FROM node:12.3.1-alpine
WORKDIR /app
RUN npm install -g pm2
COPY --from=builder ./app/dist ./dist
COPY package* ./
COPY .env ./
RUN npm install --production
CMD pm2-runtime ./dist/server.js