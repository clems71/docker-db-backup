FROM alpine:edge

WORKDIR /srv

RUN \
  echo http://dl-4.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories && \
  apk add --no-cache mongodb-tools mysql-client nodejs nodejs-npm yarn

COPY package.json .
COPY yarn.lock .
RUN yarn

COPY src src
COPY test test

ENTRYPOINT [ "yarn" ]
CMD ["start"]
