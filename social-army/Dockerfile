FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Start the worker
CMD ["npm", "start"]
