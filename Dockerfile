FROM node:18-alpine
WORKDIR /app

# Copy root package.json
COPY package*.json ./

# Copy workspace package.json files
COPY frontend/package*.json ./frontend/
COPY services/event-service/package*.json ./services/event-service/
COPY services/notification-service/package*.json ./services/notification-service/
COPY services/registration-service/package*.json ./services/registration-service/
COPY services/user-service/package*.json ./services/user-service/
COPY shared/package*.json ./shared/

# Install all dependencies including workspaces
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]