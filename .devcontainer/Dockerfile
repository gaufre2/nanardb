FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

RUN echo "*** UPDATE npm/pnpm ***" \
  && npm install --global npm@latest pnpm@latest

RUN echo "*** INSTALL Nest CLI ***" \
  && npm install --global @nestjs/cli

RUN echo "*** INSTALL Chromium ****" \
  && echo "deb http://security.debian.org/debian-security bookworm-security main" >> /etc/apt/sources.list \
  && export DEBIAN_FRONTEND=noninteractive \
  && apt-get update \
  && apt-get install -y --no-install-recommends chromium \
  && apt-get autoclean \
  && rm -rf /var/lib/apt/lists/*
