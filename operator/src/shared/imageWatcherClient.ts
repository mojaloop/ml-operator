import Logger from '@mojaloop/central-services-logger'
import got, { Response } from 'got/dist/source';
import util from 'util'
// curl -s "localhost:4006/images/mojaloop/central-ledger/v8.8.0-snapshot?strategy=bugfix"| jq

import { ImageSpec, UpgradeStrategy } from "../domain/types";
import { imageStringToSpec } from './util';

export type ImageWatcherResponse = {
  tag: string,
  fullImage: string,
}

export class ImageWatcherClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  // curl -s "localhost:4006/images/mojaloop/central-ledger/v8.8.0-snapshot?strategy=bugfix"| jq
  public async getLatestImage(imageSpec: ImageSpec, strategy: UpgradeStrategy): Promise<ImageSpec> {
    const imageSpecToUrl = (spec: ImageSpec): string => {
      return `${spec.orgId}/${spec.imageName}/${spec.tag}`
    }
    Logger.info(`ImageWatcherClient.getLatestImage() - getting latest image: ${imageSpecToUrl(imageSpec)} with strategy: ${strategy}`)
    const url = `${this.baseUrl}/images/${imageSpecToUrl(imageSpec)}?strategy=${strategy.toLowerCase()}`

    Logger.debug(`ImageWatcherClient.getLatestImage() - HTTP GET: ${url}`)
    // TODO: double check types here
    try {
      const result: Response<ImageWatcherResponse> = await got.get(url, { responseType: 'json' })
      return imageStringToSpec(result.body.fullImage)
    } catch (err) {
      Logger.error(`ImageWatcherClient.getLatestImage() failed with error: ${util.inspect(err)}`)
      throw err
    }
  }

}