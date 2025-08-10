FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Run in development mode with specific port
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
