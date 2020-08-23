import config from '~/shared/config'

const env = {
  config: config,
  baseUri: `http://127.0.0.1:${config.PORT}`
}

export default env
