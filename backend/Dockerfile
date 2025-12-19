FROM node:18-alpine

WORKDIR /app

# Install OpenSSL for Prisma and curl for health checks
RUN apk add --no-cache openssl curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 5000

# Default command (can be overridden in docker-compose)
CMD ["npm", "start"]

