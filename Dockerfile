FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --non-interactive

COPY . .

EXPOSE 3000

CMD ["yarn", "start:dev"]
