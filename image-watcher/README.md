# Image-Watcher

Image-Watcher (name TBD) is a standalone service which watches docker hub for image updates and caches them periodically. Other services can query image watcher to ask of there is a newer version for a given image, based on a provided upgrade strategy


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
- `major` - will  


> TODO: Look into the semantic versioning spec to make this a little more kosher and follow some pre-defined protocols



## TODO

- [ ] repo setup copy from other thing
- [ ] simple http server setup
- [ ] docker hub scraper
- [ ] configure cron to scrape (in memory only)
- [ ] update api
- [ ] business logic for `patch`