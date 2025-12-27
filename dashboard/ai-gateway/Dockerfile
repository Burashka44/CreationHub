FROM node:20-alpine

WORKDIR /app

# Install Docker CLI for container management
RUN apk add --no-cache docker-cli

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 9292

CMD ["npm", "start"]
