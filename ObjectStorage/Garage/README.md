# Garage

Before `v2.3.0` of <https://garagehq.deuxfleurs.fr/>, you needed to create manually the default bucket and it's keys. Now it can be created and passed at first runtime.

For versions before, you can follow :
> If you want to execute all theses commands on the host instead of docker, you need to *publish* the ports, and the network to **NOT** be *internal* only.

## Tutorial

```sh
alias garage='docker exec -it object-storage /garage'
export NODE_ID=$(garage status | grep "NO ROLE ASSIGNED" | awk '{print $1}')
```

Extract all the nodes IDs and execute for each :

```sh
ZONE=dc1
STORAGE_SIZE=5G
NODE_NAME=garage1
garage layout assign ${NODE_ID} -z ${ZONE} -c ${STORAGE_SIZE} -t ${NODE_NAME}
garage layout apply --version 1
```

- `ZONE` : set a zone name
- `NODE_NAME` : name of the node
- `STORAGE_SIZE` : size of storage in bytes

```sh
KEY_NAME=demo-app-key
BUCKET_NAME=demo-bucket
garage key create ${KEY_NAME} > aws.key
export AWS_ACCESS_KEY_ID=$(cat aws.key | grep "Key ID" | awk '{print $3}' | tr -d '\r')
export AWS_SECRET_ACCESS_KEY=$(cat aws.key | grep "Secret key" | awk '{print $3}' | tr -d '\r')
export AWS_DEFAULT_REGION="garage"
garage bucket create ${BUCKET_NAME} > aws.bucket
garage bucket allow --read --write --owner ${BUCKET_NAME} --key ${KEY_NAME}
export AWS_ENDPOINT_URL="http://127.0.0.1:3901"
```

> [!CAUTION]
> It will print all the secrets on stdout.

```sh
print_vars () {
    echo KEY_NAME=${KEY_NAME}
    echo BUCKET_NAME=${BUCKET_NAME}
    echo AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
    echo AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
}
print_vars
```

## References

- <https://garagehq.deuxfleurs.fr/documentation/quick-start/>
- <https://blog.stephane-robert.info/docs/conteneurs/orchestrateurs/docker-compose/>
- <https://blog.stephane-robert.info/docs/services/stockage/garage/>
- <https://www.glukhov.org/fr/data-infrastructure/object-storage/garage-quickstart/>
