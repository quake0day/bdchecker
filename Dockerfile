# ========== Stage 1: Build Frontend ==========
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --legacy-peer-deps && npm install ajv@8 --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# ========== Stage 2: Build Backend ==========
FROM golang:1.21-alpine AS backend-build
RUN apk add --no-cache gcc musl-dev
WORKDIR /app
COPY backend/go.mod ./
COPY backend/*.go ./
RUN go mod tidy && CGO_ENABLED=1 GOOS=linux go build -o inspector .

# ========== Stage 3: Runtime ==========
FROM alpine:3.19
RUN apk add --no-cache ca-certificates sqlite
WORKDIR /app
COPY --from=backend-build /app/inspector .
COPY --from=frontend-build /app/frontend/build ./static/
RUN mkdir -p /data
EXPOSE 8080
CMD ["/app/inspector"]
