FROM node:22-alpine

WORKDIR /app

# Copy bot files
COPY bot/package*.json ./
RUN npm clean-install --production

COPY bot/ ./
COPY .env* ../

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]
