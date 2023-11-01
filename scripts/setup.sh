#!/usr/bin/env bash
set -eEuo pipefail

nc="$(tput sgr0)"
red="$(tput setaf 1)"
green="$(tput setaf 2)"
yellow="$(tput setaf 3)"

ENV_FILE=".env"
ENV_TEMPLATE_FILE=".env.template"
DB_CONTAINER="mariadb_spotify_playback_poller"

load_env_file() {
  if [ -f "$ENV_FILE" ]; then
    echo "${yellow}loading environment variables from template '$ENV_TEMPLATE_FILE'...${nc}"
    export $(cat "$ENV_TEMPLATE_FILE" | sed 's/#.*//g' | xargs)
    echo "${yellow}overwriting template environment variables with '$ENV_FILE'...${nc}"
    export $(cat "$ENV_FILE" | sed 's/#.*//g' | xargs)
  else
    echo "${red}environment file '$ENV_FILE' does not exist, skipping...${nc}"
    exit 1
  fi
}

setup_container() {
  if docker ps -a | grep "$DB_CONTAINER" &> /dev/null; then
    echo -e "\n${yellow}mariadb container '$DB_CONTAINER' already exists, starting it...${nc}"
    docker start "$DB_CONTAINER"
  else
    echo -e "\n${yellow}mariadb container '$DB_CONTAINER' does not exist, creating it...${nc}"
    docker run \
      --detach \
      --name "$DB_CONTAINER" \
      --publish 3306:3306 \
      --env MARIADB_USER=pti \
      --env MARIADB_PASSWORD=pti \
      --env MARIADB_DATABASE=pti \
      --env MARIADB_ROOT_PASSWORD=my_super_secret_password \
      mariadb:latest
  fi
}

install_dependencies() {
  echo -e "\n${yellow}installing npm dependencies...${nc}"
  npm install
}

setup_db_schema() {
  echo -e "\n${yellow}setting up database schema...${nc}"
  npm run migrate:deploy
  npm run migrate:status
}

load_env_file
setup_container
install_dependencies
setup_db_schema
echo -e "\n${green}setup complete!${nc}"
echo "${yellow}to start the server, run 'npm run start'!${nc}"
