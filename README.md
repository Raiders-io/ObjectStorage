# ObjectStorage

This project is a service for the project [Transcendence](https://github.com/Raiders-io/Transcendence). It regroups all the needs to use an object storage (like AWS S3) as storage for all the files. It's currently the best solution for scalability, data availability, security and high performance.

The project is divided in 3 softwares :

- `API-ObjectStorage` : provides access to the object storage.
- `Garage` : open source object storage implementation compatible S3, featuring a self-hosted alternative of AWS S3, with easy deployment and highly resilient of failures (designed to be geo-distributed, even on high).
- `PostgreSQL` : metadata of files and additionnal informations of owners on theses files.

## Documentation

See the [README.md in API-ObjectStorage/](API-ObjectStorage/README.md).

## Installation

You will need to fill all the missing variables in the `.env` file. Some are described in the following tutorial and some have directly instruction in the `.env.example` file.

### API-ObjectStorage

Firstly you need to generate an `APP_KEY` for Adonis to encrypt data and create session tokens. You will need to generate (or replace) the Garage Secrets. You simply need to execute the following :

```bash
cd API-ObjectStorage
npm ci
cp .env.example .env
sed -i "s|^\(GARAGE_DEFAULT_SECRET_KEY=\).*|\1$(openssl rand -hex 32)|" .env
sed -i "s|^\(GARAGE_DEFAULT_ACCESS_KEY=\).*|\1$(openssl rand -hex 16)|" .env
node ace generate:key #will generate the key in API-ObjectStorage/.env
cd -
```

- `npm ci` : install ace.js and adonis packages
- `sed -i "s|input|output|" file` : replace the content of a key

Copy `APP_KEY` and you will need it in the main `.env` at the root of this repo.

### ObjectStorage (Garage)

You will need to execute the following to generate the `garage.toml` configuration file.

```bash
cd ObjectStorage/Garage/
chmod +x ./generate_garage_toml.sh
./generate_garage_toml.sh
cd -
```

### Docker network

As we will be using multiple services, with their own `[docker-]compose.y[a]ml`, they all have their own networks, and a `public-network` to enable remote access for the APIs that NEED to be remotely accessible. The databases and other subsidiairies must NOT be accessible by any other means than their own APIs.

To create the public network if you are using only this repository, you will need to execute this command :

```sh
docker network create public-network 2>&1 | grep -q 'Error' || true
```

The `2>&1 | grep -q 'Error' || true` part is to ignore when the network already exist.
