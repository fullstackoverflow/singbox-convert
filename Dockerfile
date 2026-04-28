FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY service.ts ./
COPY service ./service
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV CONFIG_PATH=/app/service.json

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY template.json ./template.json

CMD ["sh", "-c", "node ./dist/service.js ${CONFIG_PATH}"]
