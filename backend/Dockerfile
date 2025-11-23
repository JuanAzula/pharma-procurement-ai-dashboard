FROM node:18-slim

WORKDIR /app

# Install system dependencies required by TensorFlow.js-node
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

# Rebuild TensorFlow bindings for the container environment
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
