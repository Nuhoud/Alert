FROM node:21

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3003
EXPOSE 50051

CMD ["npm", "run", "start:dev"] 