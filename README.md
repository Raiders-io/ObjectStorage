# ObjectStorage

See the [README.md in ObjectStorage/](ObjectStorage/README.md) file for documentation.

## Installation

You will need to fill all the missing variables in the `.env` file. Some are described in the following tutorial and some have directly instruction in the `.env.example` file.

### API-ObjectStorage

Firstly you need to generate an `APP_KEY` for Adonis to encrypt data and create session tokens. You will need to execute :

```bash
cd API-ObjectStorage
npm ci #will install ace.js and adonis packages
cp .env.example .env
node ace generate:key #will generate the key in API-ObjectStorage/.env
cd -
```

Copy `APP_KEY` and you will need it in the main `.env` at the root of this repo.

### ObjectStorage (Garage)

You will need to execute the following to generate the `garage.toml` configuration file.

```bash
cd ObjectStorage/Garage/
chmod +x ./generate_garage_toml.sh
./generate_garage_toml.sh
cd -
```

You will also need to generate the following keys and copy them in the `.env` file :

```bash
export GARAGE_DEFAULT_SECRET_KEY="$(openssl rand -hex 32)"
export GARAGE_DEFAULT_ACCESS_KEY="GK$(openssl rand -hex 16)"
env | grep GARAGE_DEFAULT_*
```
