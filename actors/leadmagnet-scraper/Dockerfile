# LeadMagnet Apify Actor — Google Maps Business Scraper
# Based on Apify's official Playwright base (includes Chromium)
FROM apify/actor-node-playwright-chrome:20

# Copy package files
COPY package.json ./

# Install dependencies (Playwright is already in base image)
RUN npm install --production && rm -rf ~/.npm

# Copy source code
COPY . .

# Run the actor
CMD ["node", "src/main.js"]
