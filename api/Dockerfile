FROM node:24-slim

# 1. Install dependencies required to run Chrome (Puppeteer)
# We use the official list of dependencies for Chrome on Debian
RUN apt-get update && apt-get install -gnupg wget -y && \
    wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install google-chrome-stable -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /usr/src/app

# 3. Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# 4. Install Node dependencies
# Note: We don't need to download Chrome again via Puppeteer since we installed it globally
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

RUN npm install

# 5. Generate Prisma Client
RUN npx prisma generate

# 6. Copy source code
COPY . .

# 7. Build the app
RUN npm run build

# 8. Start command
CMD [ "npm", "run", "start:prod" ]