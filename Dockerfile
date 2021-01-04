

# FROM node:11-alpine

# RUN mkdir -p /usr/src/app

# WORKDIR /usr/src/app

# COPY . .

# RUN npm install

# EXPOSE 3000

# CMD ["npm", "run", "start"]

FROM node:12-alpine
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY .env ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000

#CMD [ "node", "server.js" ]
CMD [ "npm", "start" ]