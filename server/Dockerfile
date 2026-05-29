FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src

RUN mkdir -p uploads/products

EXPOSE 3001

CMD ["npm", "start"]
