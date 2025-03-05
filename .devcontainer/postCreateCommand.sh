#!/bin/bash

echo -e "\n[POST CREATE COMMANDS]"
echo -e "\n- UPDATE npm/pnpm:"
npm install --global npm@latest pnpm@latest

echo -e "\n- INSTALL Nest CLI:"
npm install --global @nestjs/cli

echo -e "\n- INSTALL Chromium:"
sudo apt -qq update
sudo apt -qq -y install chromium
