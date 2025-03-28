# Use the official Node.js image as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Clone the repository
RUN git clone https://github.com/StoneworxNL/SAT.git .

# Install dependencies for the main project
RUN npm install

# Change to the node-web-app directory and install its dependencies
WORKDIR /usr/src/app/node-web-app
RUN npm install

WORKDIR /usr/src/app/

# Expose the port the app runs on (adjust if necessary)
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "run", "web-app"]