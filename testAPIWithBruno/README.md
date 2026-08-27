# BrunObjectStorage

## Documentation

You can use directly the URL <https://raiders-io.github.io/BrunObjectStorage/> or open this project in Bruno.
Some Routes might not work in the URL as **opencollection** doesn't support Multipart forms right now (used in createObject).

## Commands

### Setup commands

The project uses `ENV` vars to create the requests.

To use a Token for all the requests that needs them, you need to use :

1. Signup/Login and copy the token from `data{}`.
2. Open the environment of `Bruno`/`WebDocumentation` of **opencollection**.
3. Paste the token in the value section of `API_TOKEN`.

### Reset/Revert to default

Please avoid publishing secrets as tokens, files (even paths), identities or anything else.

You can use the following command to reset everything in this repository :

```sh
chmod +x ./reset.sh
./reset.sh
```
