# Dockerfile para Node.js API com produção segura e eficiente
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Build (caso use TypeScript ou build step)
# RUN npm run build

# Remove arquivos de teste e infra do build final
RUN rm -rf tests infra .github .vscode examples

# Stage final: imagem enxuta
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]
