FROM alpine:edge

WORKDIR /srv

RUN \
  echo http://dl-4.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories && \
  apk add --no-cache mongodb-tools

RUN apk add --no-cache nodejs

COPY package.json .
RUN npm i

COPY src src

ENTRYPOINT [ "npm" ]
CMD ["start"]
