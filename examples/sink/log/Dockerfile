# Use the official Node.js image as the base image
FROM node:latest

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY numaflow.tgz numaflow.tgz

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY ./index.js ./index.js

RUN mkdir -p /var/run/numaflow/

# Start the application
CMD ["node", "index.js"]