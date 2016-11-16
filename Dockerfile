FROM alpine:edge

WORKDIR /srv

RUN \
  echo http://dl-4.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories && \
  apk add --no-cache mongodb-tools

RUN apk add --no-cache mysql-client
RUN apk add --no-cache nodejs

COPY package.json .
RUN npm i

COPY src src
COPY test test

ENTRYPOINT [ "npm" ]
CMD ["start"]
