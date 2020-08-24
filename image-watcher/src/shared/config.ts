/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License")
 and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed
 on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

// https://github.com/mozilla/node-convict
import Convict from 'convict'
import PACKAGE from '../../package.json'
import Logger from '@mojaloop/central-services-logger';
export { PACKAGE }

// Add custom docker image array support
Convict.addFormat({
  name: 'source-array',
  //@ts-ignore
  validate: function (sources: any | Array<string>, schema: any) {
    if (!Array.isArray(sources)) {
      throw new Error('Must be of type Array');
    }

    sources.forEach(source => {
      if (typeof source !== 'string') {
        throw new Error('Docker image name must be a string')
      }
      if (source.split('/').length !== 2) {
        throw new Error('Docker image name must be of format `<org>/<image>`, e.g. mojaloop/central-ledger')
      }
    })
  }
});

// interface to represent service configuration
export interface ServiceConfig {
  ENV: string;
  HOST: string;
  PORT: number;
  REDIS: {
    HOST: string;
    PORT: number;
    TIMEOUT: number;
  };
  INSPECT: {
    DEPTH: number;
    SHOW_HIDDEN: boolean;
    COLOR: boolean;
  };
  IMAGES: Array<string>;
  SCRAPE_TIME_MS: number;
}

// Declare configuration schema, default values and bindings to environment variables
export const ConvictConfig = Convict<ServiceConfig>({
  ENV: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  HOST: {
    doc: 'The InboundAPI Hostname/IP address to bind.',
    format: '*',
    default: '0.0.0.0',
    env: 'INBOUND_HOST'
  },
  PORT: {
    doc: 'The InboundAPI port to bind.',
    format: 'port',
    default: 3001,
    env: 'INBOUND_PORT'
  },
  REDIS: {
    HOST: {
      doc: 'The Redis Hostname/IP address to connect.',
      format: '*',
      default: 'localhost',
      env: 'REDIS_HOST'
    },
    PORT: {
      doc: 'The Redis port to connect.',
      format: 'port',
      default: 6379,
      env: 'REDIS_PORT'
    },
    TIMEOUT: {
      doc: 'The Redis connection timeout',
      format: 'nat',
      default: 100,
      env: 'REDIS_TIMEOUT'
    }
  },
  INSPECT: {
    DEPTH: {
      doc: 'Inspection depth',
      format: 'nat',
      env: 'INSPECT_DEPTH',
      default: 4
    },
    SHOW_HIDDEN: {
      doc: 'Show hidden properties',
      format: 'Boolean',
      default: false
    },
    COLOR: {
      doc: 'Show colors in output',
      format: 'Boolean',
      default: true
    }
  },
  IMAGES: {
    doc: 'A list of images to watch for',
    format: 'source-array',
    default: [],
    // TODO: fix typings here, and add docker image parsing
    //@ts-ignore
    children: {
      doc: 'A docker image name',
      format: 'string',
      default: null
    }
  },
  SCRAPE_TIME_MS: {
    doc: 'How long to wait before scraping the docker registry again',
    format: 'nat',
    default: 60 * 1000, //60 seconds
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
  HOST: ConvictConfig.get('HOST'),
  PORT: ConvictConfig.get('PORT'),
  REDIS: ConvictConfig.get('REDIS'),
  INSPECT: ConvictConfig.get('INSPECT'),
  IMAGES: ConvictConfig.get('IMAGES'),
  SCRAPE_TIME_MS: ConvictConfig.get('SCRAPE_TIME_MS')
}

Logger.debug(`Config - parsed config is ${JSON.stringify(config, null, 2)}`)

export default config
