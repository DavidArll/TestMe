FROM node:18-alpine

WORKDIR /app

RUN npm install -g expo-cli --no-warnings --no-interactive

COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npx expo install react-dom react-native-web @expo/metro-runtime
RUN npm install --save-dev typescript @types/react @types/react-native --legacy-peer-deps


COPY . .

EXPOSE 19000 19001 19002 8081 19006

CMD ["npx", "expo", "start", "--web", "--host", "lan"]
