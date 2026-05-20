FROM node:20-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm install
RUN npx prisma generate

# Copy source code
COPY src ./src/

EXPOSE 3001

# Run database synchronization then start the server
CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
