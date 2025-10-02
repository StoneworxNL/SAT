#!/bin/bash

# Clone the latest version of the repo
rm -rf /usr/src/app/*
git clone https://github.com/StoneworxNL/SAT.git /usr/src/app

# Install dependencies
cd /usr/src/app
npm install

cd node-web-app
npm install

# Start the app
cd /usr/src/app
npm run web-app