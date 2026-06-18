#!/bin/bash

create_env()
{
	if [ -f .env ]; then
		echo ".env file already exists. Do you want to overwrite it?"
		read -p "Continue? (Y/n): " confirm
		confirm=${confirm:-y} # Default to 'y' if no input is provided
		if ! [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
			echo "Setup cancelled."
			exit 1
		fi
	fi

	cd API-ObjectStorage/ 
	npm ci >/dev/null 
	cp .env.example ../.env 
	sed -i "s|^\(APP_KEY=\).*|\1$(node ace generate:key --show | awk '{print $3}')|" ../.env
	cd -
	sed -i "s|^\(GARAGE_DEFAULT_SECRET_KEY=\).*|\1$(openssl rand -hex 32)|" .env
	sed -i "s|^\(GARAGE_DEFAULT_ACCESS_KEY=\).*|\1$(openssl rand -hex 16)|" .env
}

configure_postgres()
{
	echo "Do you want to manually configure the PostgreSQL root user and password? (This will overwrite existing values in .env)"
	read -p "Continue? (y/N): " confirm
	confirm=${confirm:-n} # Default to 'n' if no input is provided
	if ! [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
		sed -i "s|^\(POSTGRES_USER=\).*|\1$(openssl rand -hex 31)|" .env
		sed -i "s|^\(POSTGRES_PASSWORD=\).*|\1$(openssl rand -hex 64)|" .env
		return
	fi

	echo "Choose a name for the PostgreSQL root user:"
	read POSTGRES_USER
	echo "Choose a password for the PostgreSQL root user (hidden):"
	read -s POSTGRES_PASSWORD
	sed -i "s|^\(POSTGRES_PASSWORD=\).*|\1${POSTGRES_PASSWORD}|" .env
	sed -i "s|^\(POSTGRES_USER=\).*|\1${POSTGRES_USER}|" .env
}

configure_garage()
{
	cd Garage/
	chmod +x ./generate_config.sh
	./generate_config.sh
}

create_env
configure_postgres
configure_garage

echo "Environment setup complete. Please review the .env file and make any necessary adjustments."
