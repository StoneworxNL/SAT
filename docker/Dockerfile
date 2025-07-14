# Use the official Node.js image as the base image
FROM node:20

# Install dependencies and Eclipse Temurin JDK
RUN apt-get update && \
    apt-get install -y wget gnupg curl && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor -o /etc/apt/keyrings/adoptium.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" | tee /etc/apt/sources.list.d/adoptium.list && \
    apt-get update && \
    apt-get install -y temurin-17-jdk && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Verify installation
RUN java -version && node -v && npm -v

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install Graphviz and Java JRE
RUN apt-get update && \
    apt-get install -y graphviz && \
    rm -rf /var/lib/apt/lists/*

# Clone the repository
RUN git clone https://github.com/StoneworxNL/SAT.git .

#don't know why but this is needed to get the latest version of the repo
RUN git pull

# Install dependencies for the main project
RUN npm install

# Change to the node-web-app directory and install its dependencies
WORKDIR /usr/src/app/node-web-app
RUN npm install

WORKDIR /usr/src/app/
VOLUME /usr/src/app/config

# Expose the port the app runs on (adjust if necessary)
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "run", "web-app"]