FROM oven/bun:1

WORKDIR /app

COPY package*.json tsconfig.json /app/

COPY src /app/src

RUN bun install

ENTRYPOINT ["bun", "/app/src/main.ts"]