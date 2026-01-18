FROM node:20
WORKDIR /app
COPY ./server.js ./
COPY ./package.json ./
RUN mkdir -p uploads
RUN npm i --verbose
EXPOSE 4000
CMD ["node", "server.js"]