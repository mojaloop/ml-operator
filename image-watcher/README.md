# Image-Watcher

Image-Watcher (name TBD) is a standalone ml-operator service which watches docker hub for image updates and caches them periodically. Other services can query image watcher to ask of there is a newer version for a given image, based on a provided upgrade strategy


## Try it out
```bash
docker-compose up -d redis
npm run start

curl -s "localhost:4006/images/mojaloop/central-ledger/v8.8.0-snapshot?strategy=major" | jq
curl -s "localhost:4006/images/mojaloop/central-ledger/v8.8.0-snapshot?strategy=minor" | jq
curl -s "localhost:4006/images/mojaloop/central-ledger/v8.8.0-snapshot?strategy=bugfix" | jq
curl -s "localhost:4006/images/mojaloop/central-ledger/v8.8.0-snapshot?strategy=patch" | jq
```

## Running with Docker-Compose

```bash
docker-compose up -d
# wait for everything to be up and running
curl -s "localhost:4006/images/mojaloop/central-ledger/v8.8.0-snapshot?strategy=major"| jq
```

## API

See [./src/interface/swagger.yaml](./src/interface/swagger.yaml) for the full spec.

###  `GET /image/{org}/{image}/{tag}`

e.g. 
```
GET /image/mojaloop/central-ledger/v11.0.0?strategy=patch
Content-Type: application/json
```

Example response:
```json
{
  "tag": "v11.0.0-patch.1",
  "fullImage": "mojaloop/central-ledger/v11.0.0-patch.1"
}
```

Where strategy is one of:
- `patch` - will return the latest patch for the given image version
- `bugfix` - will return the latest bugfix version,  i.e. `v11.0.Z`
- `minor` - will return the latest minor version, i.e. `v11.Y.Z`
- `major` - will retun the latest major version, i.e. `vX.Y.Z`

## Developing
```bash
# install dependencies
npm install

# run redis
docker-compose up -d redis

# run the server in 'watch' mode
npm run dev
```


## Docker API Snippets

```bash
#reference: https://www.arthurkoziel.com/dockerhub-registry-api/

# All mojaloop images...
curl -s "https://hub.docker.com/v2/repositories/mojaloop/?page_size=100" | jq -r '.results|.[]|.name'

export DOCKER_USERNAME="******"
export DOCKER_PASSWORD="******"
export TOKEN=$(curl -s -H "Content-Type: application/json" -X POST -d '{"username": "'${DOCKER_USERNAME}'", "password": "'${DOCKER_PASSWORD}'"}' https://hub.docker.com/v2/users/login/ | jq -r .token)


export AUTH_SERVICE='registry.docker.io'
export AUTH_SCOPE="repository:mojaloop/central-ledger:pull"
export REGISTRY_TOKEN=$(curl -fsSL "https://auth.docker.io/token?service=$AUTH_SERVICE&scope=$AUTH_SCOPE" | jq --raw-output '.token')

# TODO: pagination doesn't work for some reason...
curl -fsSL \
    -H "Authorization: Bearer $REGISTRY_TOKEN" \
    "https://registry-1.docker.io/v2/mojaloop/central-ledger/tags/list?n=10&last=10" | jq
```


## TODO

- [x] repo setup copy from other thing
- [x] simple http server setup
- [x] draft api
- [x] docker hub scraper
- [x] configure cron to scrape and write to redis
- [x] update api
- [x] business logic for `patch`
- [ ] cleanup repo: package.json, readmes, unused files, tests
- [ ] Look into the semantic versioning spec to make this a little more kosher and follow some pre-defined protocols
