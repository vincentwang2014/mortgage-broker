# Stage 1: build frontend
FROM node:20-alpine AS frontend-build
RUN apk add --no-cache git
RUN git clone --depth 1 https://github.com/vincentwang2014/mortgage-broker.git /repo
WORKDIR /repo/frontend
RUN npm ci && npm run build

# Stage 2: production backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
COPY --from=frontend-build /repo/frontend/dist ./frontend/dist
EXPOSE 3001
CMD ["node", "server.js"]
