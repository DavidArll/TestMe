FROM node:18-alpine

WORKDIR /app

RUN npm install -g expo-cli --no-warnings --no-interactive

COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install --save-dev typescript @types/react @types/react-native --legacy-peer-deps


COPY . .

EXPOSE 19000 19001 19002 8081

CMD ["npx", "expo", "start", "--host", "lan"]
