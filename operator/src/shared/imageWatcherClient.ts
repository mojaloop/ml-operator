// curl -s "localhost:4006/images/mojaloop/central-ledger/v8.8.0-snapshot?strategy=bugfix"| jq

import { ImageSpec, UpgradeStrategy } from "../domain/types";

export class ImageWatcherClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  public async getLatestImage(imageSpec: ImageSpec, strategy: UpgradeStrategy): Promise<ImageSpec> {
    // curl -s "localhost:4006/images/mojaloop/central-ledger/v8.8.0-snapshot?strategy=bugfix"| jq

    const imageSpecToUrl = (spec: ImageSpec): string => {
      return `${spec.orgId}/${spec.imageName}/${spec.tag}`
    }
    const url = `${this.baseUrl}/images/${imageSpecToUrl(imageSpec)}?strategy=${strategy}`

    const result = got.get(url)
    // TODO error handling?
    return result.body
  }

}