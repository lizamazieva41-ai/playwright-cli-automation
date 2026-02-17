# Lightweight container for playwright-cli-automation
# Uses Playwright base image which already includes browsers
FROM mcr.microsoft.com/playwright:latest

# Create app directory
WORKDIR /usr/src/app

# Copy package metadata first to install deps
COPY package*.json ./

# Install production dependencies
RUN npm install --production --no-audit --progress=false

# Install Playwright browsers to match the installed version
RUN npx playwright install firefox --with-deps

# Copy application source
COPY . .

# Ensure data directories exist and are writable
RUN mkdir -p data/logs data/sessions data/output \
  && chown -R pwuser:pwuser data || true

ENV NODE_ENV=production
ENV HEALTH_PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${HEALTH_PORT}/health || exit 1

CMD ["npm", "start"]
