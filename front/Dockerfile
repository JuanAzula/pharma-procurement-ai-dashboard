# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Configure nginx for SPA routing and API proxying
RUN echo 'server { \
    listen 80; \
    \
    # Proxy /api/backend/* to backend:4000/* (strip /api/backend prefix) \
    location /api/backend/ { \
        rewrite ^/api/backend/(.*) /$1 break; \
        proxy_pass http://backend:4000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    # Proxy /api/forecast to backend:4000/forecast (strip /api prefix) \
    location /api/forecast { \
        rewrite ^/api/(.*) /$1 break; \
        proxy_pass http://backend:4000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    # Proxy /api/insights to backend:4000/insights (strip /api prefix) \
    location /api/insights { \
        rewrite ^/api/(.*) /$1 break; \
        proxy_pass http://backend:4000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    # SPA routing - serve index.html for all routes \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
