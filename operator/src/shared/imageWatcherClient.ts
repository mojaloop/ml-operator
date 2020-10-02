import Logger from '@mojaloop/central-services-logger'
import got, { Response } from 'got/dist/source';
// curl -s "localhost:4006/images/mojaloop/central-ledger/v8.8.0-snapshot?strategy=bugfix"| jq

import { ImageSpec, UpgradeStrategy } from "../domain/types";

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
    Logger.debug(`ImageWatcherClient.getLatestImage() - getting latest image: ${imageSpecToUrl(imageSpec)} with strategy: ${strategy}`)
    const url = `${this.baseUrl}/images/${imageSpecToUrl(imageSpec)}?strategy=${strategy}`

    // TODO: double check types here
    const result: Response<ImageSpec> = await got.get(url, { responseType: 'json' })
    console.log('result body is', result.body)
    // TODO error handling?
    return result.body
  }

}