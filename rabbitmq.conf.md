# RabbitMQ

Extracted from : [RabbitMQ Naming Conventions for Queues, Exchanges, and Vhosts - Medium](https://medium.com/@aliakbarhosseinzadeh/rabbitmq-naming-conventions-for-queues-exchanges-and-vhosts-a36b23e47349)

## Vhost

> `${stage}/${app}/`

### Stage

- `/dev`
- `/prod`

### App

`/raiders-io`

## Exchange

> x.<domain>.<purpose>

- `x.auth.events`
- `x.object.events`

## Routing Key

For Auth :

- `user.created`

For Object:

- `object.created`
- `quota.reset`
- `data.full.request`
- `data.full.delete`

## Queues

> q.<consumer>.<message-purpose>

## list of services

- `auth`
- `object`
- `exam`
- `profile`
- `message`
- `lesson`
