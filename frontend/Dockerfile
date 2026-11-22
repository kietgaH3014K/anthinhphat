FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Chỉ truyền giá trị CÔNG KHAI vào bản build
ARG VITE_API_URL=/api/v1
ARG VITE_GA_ID=
ENV VITE_API_URL=$VITE_API_URL VITE_GA_ID=$VITE_GA_ID VITE_USE_MOCK=false
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY proxy_params /etc/nginx/proxy_params
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
