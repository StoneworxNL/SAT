# Use the official Node.js image as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install Graphviz and Java JRE
RUN apt-get update && \
    apt-get install -y graphviz openjdk-24-jre && \
    rm -rf /var/lib/apt/lists/*

# Add Java to PATH
ENV PATH="/usr/lib/jvm/java-24-openjdk-amd64/bin:${PATH}"    

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