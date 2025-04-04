FROM node:22-alpine3.19

ARG APP_ROOT=/home/app

WORKDIR ${APP_ROOT}

COPY package.json yarn.lock .

RUN yarn install

COPY . .

CMD ["sleep", "infinity"]
