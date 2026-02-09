FROM node:20-alpine AS build
WORKDIR /app

COPY package.json bun.lock* package-lock* yarn.lock* pnpm-lock* ./
RUN npm install

COPY . .

# API on localhost:5107 (run postman-api separately)
ENV VITE_PROXY_URL=http://localhost:5107

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
