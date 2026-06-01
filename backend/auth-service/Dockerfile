FROM node:20

# Install Docker CLI statically
RUN curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-24.0.7.tgz | tar -xz -C /usr/local/bin --strip-components=1 docker/docker

# Install Docker Compose statically
RUN curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose \
    && mkdir -p /usr/local/lib/docker/cli-plugins \
    && ln -s /usr/local/bin/docker-compose /usr/local/lib/docker/cli-plugins/docker-compose

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
