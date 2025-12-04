FROM node:24

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY . .

RUN npm run build

CMD [ "/bin/sh", "-c", "npx prisma migrate deploy && npm run start:prod" ]