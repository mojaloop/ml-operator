FROM node:12.16.1-alpine as builder
USER root
WORKDIR /opt/image-watcher

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp

COPY package.json package-lock.json* /opt/image-watcher/
RUN npm ci

COPY . /opt/image-watcher

FROM node:12.16.1-alpine
WORKDIR /opt/image-watcher

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: image-watcher-user
RUN adduser -D image-watcher-user
USER image-watcher-user
COPY --chown=image-watcher-user --from=builder /opt/image-watcher .

EXPOSE 4005
CMD ["npm", "run", "start"]
