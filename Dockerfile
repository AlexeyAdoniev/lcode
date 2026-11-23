FROM node:24-bookworm-slim AS base

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --non-interactive

COPY . .

EXPOSE 3000

CMD ["yarn", "start:dev"]

FROM base AS sandbox

RUN apt-get update \
  && apt-get install --yes --no-install-recommends docker.io \
  && rm -rf /var/lib/apt/lists/*

FROM base AS app
