FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html ./
COPY public ./public
COPY src ./src
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
ARG VITE_API_BASE_URL=/api
ARG VITE_AUTH_CLIENT_ID=sqlh1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_AUTH_CLIENT_ID=$VITE_AUTH_CLIENT_ID
RUN npx vite build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
