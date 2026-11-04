# Summit Shine for the ElectTech VPS (deploy/vps/docker-compose.yml). Netlify ignores this file.
FROM node:22-alpine
# Prisma's engines need OpenSSL on Alpine
RUN apk add --no-cache openssl libc6-compat && npm install -g pnpm@latest
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY . .
ARG BASE_PATH=""
ARG NEXT_PUBLIC_SITE_URL=""
ENV BASE_PATH=$BASE_PATH NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# Pages that don't depend on the request are rendered from the database during the build, as on
# Netlify. Compose passes the database's address as a build secret, so it stays out of the image.
RUN --mount=type=secret,id=build_database_url,required=true \
    DATABASE_URL="$(cat /run/secrets/build_database_url)" \
    DIRECT_URL="$(cat /run/secrets/build_database_url)" \
    pnpm exec next build

ENV NODE_ENV=production
EXPOSE 3000
# Applies any migration the database doesn't have yet, then serves
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && exec pnpm exec next start -H 0.0.0.0 -p 3000"]
