FROM node:12

WORKDIR /usr/src/app
COPY .env ./
COPY package*.json ./
COPY package-lock.json ./
COPY tsconfig.json ./

RUN npm install

COPY src/ src/


RUN npm run compile
# RUN npm run seed # GOTTA FIX IT

CMD ["node", "dist/index.js"]