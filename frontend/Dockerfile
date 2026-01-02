# Use Node LTS
FROM node:20-alpine


# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of frontend code
COPY . .

# Expose frontend port
EXPOSE 3000

# Start React dev server
CMD ["npm", "run", "dev"]
