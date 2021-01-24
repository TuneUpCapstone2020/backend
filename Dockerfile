FROM node:12-alpine as builder
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
FROM node:12-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app /usr/src/app/
COPY . .

EXPOSE 3000

#CMD [ "node", "server.js" ]
CMD [ "npm", "start" ]