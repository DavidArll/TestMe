# Use Node.js 18 as the base image (Alpine for smaller size)
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Install expo-cli globally in the container
# Using --no-warnings to reduce noise, and --no-interactive for CI environments
RUN npm install -g expo-cli --no-warnings --no-interactive

# Copy package.json and package-lock.json (or yarn.lock if used) to leverage Docker cache
COPY package*.json ./

# Install project dependencies
# Using --legacy-peer-deps to handle potential conflicts (as seen in local setup)
RUN npm install --legacy-peer-deps

# Install/ensure critical Expo packages and related dependencies
RUN npm install --legacy-peer-deps react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context react-dom react-native-web @react-native-async-storage/async-storage expo-document-picker expo-file-system expo-sharing

# Copy the rest of the application code into the container
COPY . .

# Expose ports required by Expo
# 19000: Expo Metro Bundler inspector
# 19001: Expo Metro Bundler (React Native packager)
# 19002: Expo DevTools UI (Web UI for Metro Bundler)
# 8081: Metro Bundler (often the primary port Metro listens on, Expo CLI might proxy this)
EXPOSE 19000 19001 19002 8081

# Set the default command to start the Expo development server with tunnel option
# Using npx to ensure it uses the project's local version of expo if available, 
# falling back to global if not (though global is installed).
# CMD ["expo", "start", "--tunnel"] 
# Using npx expo start is generally preferred for invoking the local version of Expo CLI tied to the project's SDK version.
CMD ["npx", "expo", "start", "--tunnel"]
