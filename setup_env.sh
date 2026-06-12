#!/bin/bash

create_env()
{
	# if [ -f .env ]; then
	# 	echo ".env file already exists. Skipping creation."
	# 	return
	# fi
	cd API-ObjectStorage/ 
	npm ci >/dev/null 
	cp .env.example ../.env 
	sed -i "s|^\(APP_KEY=\).*|\1$(node ace generate:key --show | awk '{print $3}')|" ../.env
	cd -
	sed -i "s|^\(GARAGE_DEFAULT_SECRET_KEY=\).*|\1$(openssl rand -hex 32)|" .env
	sed -i "s|^\(GARAGE_DEFAULT_ACCESS_KEY=\).*|\1$(openssl rand -hex 16)|" .env
	# echo "Please edit the .env file with your own values, use README.md as a reference."
}

configure_postgres()
{
	echo "Choose a name for the PostgreSQL root user:"
	read POSTGRES_USER
	echo "Choose a password for the PostgreSQL root user (hidden):"
	read -s POSTGRES_PASSWORD
	sed -i "s|^\(POSTGRES_PASSWORD=\).*|\1${POSTGRES_PASSWORD}|" .env
	sed -i "s|^\(POSTGRES_USER=\).*|\1${POSTGRES_USER}|" .env
}

configure_garage()
{
	cd ObjectStorage/Garage/
	chmod +x ./generate_config.sh
	./generate_config.sh
}

create_env
configure_postgres
configure_garage

echo "Environment setup complete. Please review the .env file and make any necessary adjustments."
