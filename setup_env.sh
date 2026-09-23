#!/bin/bash

#Flags
NON_INTERACTIVE=false
FORCE_REGENERATE=false
HELP=false

create_env()
{
	if [ "$NON_INTERACTIVE" = true ] && [ "$FORCE_REGENERATE" = false ] && [ -f .env ]; then
		echo ".env file already exists. Skipping..."
		exit 0
	fi
	if [ "$FORCE_REGENERATE" = false ] && [ "$NON_INTERACTIVE" = false ] && [ -f .env ]; then
		echo ".env file already exists. Do you want to overwrite it?"
		read -p "Continue? (Y/n): " confirm
		confirm=${confirm:-y} # Default to 'y' if no input is provided
		if ! [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
			echo "Not replacing the file."
			exit 0
		fi
		# mv .env .env.backup
	fi
	echo "Creating .env from scratch"

	cd API-ObjectStorage/
	npm ci >/dev/null 
	cp .env.example ../.env 
	sed -i "s|^\(APP_KEY=\).*|\1$(node ace generate:key --show | awk '{print $3}')|" ../.env
	cd -
}

configure_postgres()
{
	configure_postgres_auth()
	{
		echo "Generating user and password for Postgres"
		sed -i "s|^\(POSTGRES_USER=\).*|\1$(openssl rand -base64 63 | tr -dc '[:alnum:]' | head -c 63 )|" .env
		sed -i "s|^\(POSTGRES_PASSWORD=\).*|\1$(openssl rand -base64 128 | tr -dc '[:alnum:]' | head -c 128 )|" .env
	}

	if [ "$NON_INTERACTIVE" = true ]; then
		configure_postgres_auth
		return
	fi
	echo "Do you want to manually configure the PostgreSQL root user and password? (This will overwrite existing values in .env)"
	read -p "Continue? (y/N): " confirm
	confirm=${confirm:-n} # Default to 'n' if no input is provided
	if ! [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
		configure_postgres_auth
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
	sed -i "s|^\(GARAGE_DEFAULT_SECRET_KEY=\).*|\1$(openssl rand -hex 32)|" .env
	sed -i "s|^\(GARAGE_DEFAULT_ACCESS_KEY=\).*|\1$(openssl rand -hex 16)|" .env
	sed -i "s|^\(GARAGE_RPC_SECRET=\).*|\1$(openssl rand -hex 32)|" .env
	sed -i "s|^\(GARAGE_ADMIN_TOKEN=\).*|\1$(openssl rand -base64 32)|" .env
	sed -i "s|^\(GARAGE_METRICS_TOKEN=\).*|\1$(openssl rand -base64 32)|" .env
}

check_flags() {
	while [[ "$#" -gt 0 ]]; do
		case $1 in
			--non-interactive) NON_INTERACTIVE=true ;;
			--force) FORCE_REGENERATE=true ;;
			--help) HELP=true ;;
			-[a-zA-Z]*) 
			local flags=${1#-}
			for (( i=0; i<${#flags}; i++ )); do
				local flag=${flags:$i:1}
				case $flag in
					i) NON_INTERACTIVE=true ;;
					f) FORCE_REGENERATE=true ;;
					h) HELP=true ;;
					*) echo "Unknown flag: -${flags:$i:1}"; exit 1 ;;
				esac
			done
			;;
			*) echo "Unknown parameter passed: $1"; exit 1 ;;
		esac
		shift
	done
}

check_flags "$@"
if [ "$HELP" = true ]; then
	echo "Usage: ./start.sh [options]"
	echo "Options:"
	echo "  -i, --non-interactive    Run the script in non-interactive mode (use default values)"
	echo "  -f, --force              Force regeneration of the .env file"
	echo "  -h, --help               Show this help message"
	exit 0
fi

create_env
configure_postgres
configure_garage

echo "Environment setup complete. Please review the .env file and make any necessary adjustments."
