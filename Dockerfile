FROM node:12.16.1-alpine as builder
USER root
WORKDIR /opt/ml-operator

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
  && cd $(npm root -g)/npm \
  && npm config set unsafe-perm true \
  && npm install -g node-gyp

COPY package.json package-lock.json* /opt/ml-operator/
RUN npm ci

COPY . /opt/ml-operator

FROM node:12.16.1-alpine
WORKDIR /opt/ml-operator

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: ml-operator-user
RUN adduser -D ml-operator-user
USER ml-operator-user
COPY --chown=ml-operator-user --from=builder /opt/ml-operator .

EXPOSE 4005
CMD ["npm", "run", "start"]
