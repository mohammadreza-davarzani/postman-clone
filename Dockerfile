FROM node:20-alpine AS build
WORKDIR /app

COPY package.json bun.lock* package-lock* yarn.lock* pnpm-lock* ./
RUN npm install

COPY . .

# Production API & download URLs
ENV VITE_PROXY_URL=https://postwomanbackend.liara.run
ENV VITE_DOWNLOAD_URL_MAC=https://github.com/mohammadreza-davarzani/postman-clone/releases/download/v0.1.0/Postman.Clone-0.1.0-arm64.dmg


RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
