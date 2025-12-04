FROM node:24-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

RUN npm install

RUN npx prisma generate

# 6. Copy source code
COPY . .

# 7. Build the app
RUN npm run build

# 8. Start command
CMD [ "npm", "run", "start:prod" ]