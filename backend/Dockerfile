# --- Étape 1 : build ---
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# --- Étape 2 : image finale, allégée ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

# Applique les migrations en attente puis démarre l'API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
