# Use stable node version
FROM node:20

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy rest of the project
COPY . .

# Build Next.js app (опціонально)
# RUN npm run build

# Expose port
EXPOSE 3000

# Default command
CMD ["npm", "run", "dev"]
