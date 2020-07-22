const Koa = require('koa');
const Router = require('@koa/router');
const semver = require("semver");

const app = new Koa();
const router = new Router();

const services = {
  "mojaloop-operator": [
    "1.0.1",
  ],
  "central-ledger": [
    "10.5.2"
  ]
}

router.get('/version', (ctx, next) => {
  const query = ctx.query

  const image = query.image
  const tag = query.tag

  if(tag && image) {
    console.log(tag, image)
    const versions = services[image]

    const response = getLatest(tag, versions)

    console.log(response)

    ctx.body = response
    ctx.status = 200
  }
});

router.get('/updateversion', (ctx, next) => {
  const query = ctx.query

  const image = query.image
  const tag = query.tag

  if(tag && image) {
    services[image] = [
      tag
    ]

    console.log(services)

    ctx.status = 200
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);

// TODO hacky code for now
function getLatest (current, versions) {
  const currentVersion = semver.parse(current)

  let latest
  versions.forEach(item => {
    const x = semver.satisfies(item, `${currentVersion.major}.${currentVersion.minor}.x`)
    if(x === true) {
      latest = item
    }
  })

  const is_latest = !semver.gt(latest, current)
  return {
    is_latest: is_latest,
    latest_tag: latest
  }
}
