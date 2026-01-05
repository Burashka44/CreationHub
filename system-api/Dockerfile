FROM node:20-alpine

WORKDIR /app

# Install tools for ping, curl, wg, and dns resolution
RUN apk add --no-cache iputils curl wireguard-tools postgresql-client docker-cli openresolv bash iproute2

COPY package*.json ./
RUN npm install --production

COPY index.js ./
COPY routes ./routes

EXPOSE 9191

CMD ["node", "index.js"]
