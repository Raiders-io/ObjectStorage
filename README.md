# ObjectStorage

This project is a service for the project [Transcendence](https://github.com/Raiders-io/Transcendence). It regroups all the needs to use an object storage (like AWS S3) as storage for all the files. It's currently the best solution for scalability, data availability, security and high performance.

The project is divided in 3 softwares :

- `API-ObjectStorage` : provides access to the object storage.
- `Garage` : open source object storage implementation compatible S3, featuring a self-hosted alternative of AWS S3, with easy deployment and highly resilient of failures (designed to be geo-distributed, even on high).
- `PostgreSQL`
  - metadata of files and additionnal informations of owners on theses files.
  - user quotas (upload/download limit, number of files, max storage use...)
  - rules over files permissions (public, private, shared accross a team)

## Documentation

See the [README.md in API-ObjectStorage/](API-ObjectStorage/README.md).

## Installation

You will need to fill all the missing variables in the `.env` file. Some are described in the following tutorial and some have directly instruction in the `.env.example` file.

If you wish to setup all the `.env` vars directly, we advise you to use this command :

```sh
chmod +x ./setup_env.sh && ./setup_env.sh
```

If you want to setup manually the variables, you can use the following :

### API-ObjectStorage

Firstly you need to generate an `APP_KEY` for Adonis to encrypt data and create session tokens. You will need to generate (or replace) the Garage Secrets. You simply need to execute the following :

```bash
cd API-ObjectStorage/ 
npm ci >/dev/null 
cp .env.example ../.env 
sed -i "s|^\(APP_KEY=\).*|\1$(node ace generate:key --show | awk '{print $3}')|" ../.env
cd -
sed -i "s|^\(GARAGE_DEFAULT_SECRET_KEY=\).*|\1$(openssl rand -hex 32)|" .env
sed -i "s|^\(GARAGE_DEFAULT_ACCESS_KEY=\).*|\1$(openssl rand -hex 16)|" .env
cd -
```

- `npm ci` : install ace.js and adonis packages
- `sed -i "s|input|output|" file` : replace the content of a key
- `APP_KEY` : used to encrypt cookies, sessions and other things for AdonisJS
- `GARAGE_DEFAULT_ACCESS_KEY` : identifier (key name) of a bucket for Garage
- `GARAGE_DEFAULT_SECRET_KEY` : password for the key

#### Generation

- `APP_KEY` : needs to be generated using the command `node ace generate:key`
- `GARAGE_DEFAULT_ACCESS_KEY` : needs to be generated using the command `openssl rand -hex 16`
- `GARAGE_DEFAULT_SECRET_KEY` : needs to be generated using the command `openssl rand -hex 32`

### ObjectStorage (Garage)

You will need to execute the following to generate the `garage.toml` configuration file.

```bash
cd Garage/
chmod +x ./generate_config.sh
./generate_config.sh
cd -
```

- `rpc_secret` : secret for communication between Garage nodes
- `admin_token` : token for admin api access
- `metrics_token` : token for metrics access

#### Generation

- `rpc_secret` : needs to be generated using the command `openssl rand -hex 32`
- `admin_token` : needs to be generated using the command `openssl rand -hex 32`
- `metrics_token` : needs to be generated using the command `openssl rand -hex 32`

---

## Docker

### Docker network

As we will be using multiple services, with their own `[docker-]compose.y[a]ml`, they all have their own networks, and a `public-network` to enable remote access for the APIs that NEED to be remotely accessible. The databases and other subsidiairies must NOT be accessible by any other means than their own APIs.

To create the public network if you are using only this repository, you will need to execute this command :

```sh
docker network create public-network 2>&1 | grep -q 'Error' || true
```

The `2>&1 | grep -q 'Error' || true` part is to ignore when the network already exist.

### Docker compose

To build all the apps in one go, you can simply execute this command :

```sh
docker compose up -d
```

### Docker volumes

We are using docker volumes to manage data of containers.

> [!WARNING]
> If you really want to use bind mounts, we advise you to use something like :

To create all the directories in one command.

```sh
mkdir -p data/{postgresql,api-object-storage/{tmp,storage},garage/{data,meta}}
```

If your shell doesn't support the `{` and `}` in commands :

```sh
mkdir -p data/postgresql
mkdir -p data/api-object-storage/tmp
mkdir -p data/api-object-storage/storage
mkdir -p data/garage/data
mkdir -p data/garage/meta
```
