# --- Étape 1 : build ---
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build
# Diagnostic : affiche la structure réelle de dist/ après build
RUN echo "=== Contenu de dist/ après build ===" && find dist -type f

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

# Applique les migrations, puis démarre en recherchant main.js où qu'il
# soit dans dist/ (robuste à un éventuel décalage de structure de sortie).
CMD ["sh", "-c", "npx prisma migrate deploy && node \"$(find dist -type f -name main.js | head -1)\""]
