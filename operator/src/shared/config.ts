
// https://github.com/mozilla/node-convict
import Convict from 'convict'
import PACKAGE from '../../package.json'
import { UpgradeStrategy } from '../domain/types'

export { PACKAGE }

// interface to represent service configuration
export interface ServiceConfig {
  ENV: string
  SERVICES: Array<string>
  UPGRADE_STRATEGY: UpgradeStrategy,
  CHECK_FOR_UPDATE_CRON: string,
  SLACK_WEBHOOK_URL: string,
  IMAGE_WATCHER_CLIENT_URL: string,
}

// Declare configuration schema, default values and bindings to environment variables
export const ConvictConfig = Convict<ServiceConfig>({
  ENV: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  SERVICES: {
    doc: 'The list of kubernetes deployments to watch',
    default: [],
    env: 'SERVICES'
  },
  UPGRADE_STRATEGY: {
    doc: 'The upgrade strategy for the deployments with outdated images',
    default: UpgradeStrategy.BUGFIX,
    env: 'UPGRADE_STRATEGY'
  },
  CHECK_FOR_UPDATE_CRON: {
    doc: 'A cron expression for when to watch for image upgrades. Defaults to every minute.',
    default: '0 * * * * *',
    env: 'CHECK_FOR_UPDATE_CRON'
  },
  SLACK_WEBHOOK_URL: {
    doc: 'The url of the slack webhook used to inform users about upgrades',
    default: 'localhost:4000',
    format: 'url',
    env: 'SLACK_WEBHOOK_URL'
  },
  IMAGE_WATCHER_CLIENT_URL: {
    doc: 'The url of the image watcher service',
    format: 'url',
    default: 'localhost:4006',
    env: 'IMAGE_WATCHER_CLIENT_URL'
  }
})

// Load environment dependent configuration
const env = ConvictConfig.get('ENV')
ConvictConfig.loadFile(`${__dirname}/../../config/${env}.json`)

// Perform configuration validation
ConvictConfig.validate({ allowed: 'strict' })

// extract simplified config from Convict object
const config: ServiceConfig = {
  ENV: ConvictConfig.get('ENV'),
  SERVICES: ConvictConfig.get('SERVICES'),
  UPGRADE_STRATEGY: ConvictConfig.get('UPGRADE_STRATEGY'),
  CHECK_FOR_UPDATE_CRON: ConvictConfig.get('CHECK_FOR_UPDATE_CRON'),
  SLACK_WEBHOOK_URL: ConvictConfig.get('SLACK_WEBHOOK_URL'),
  IMAGE_WATCHER_CLIENT_URL: ConvictConfig.get('IMAGE_WATCHER_CLIENT_URL'),
}

export default config
