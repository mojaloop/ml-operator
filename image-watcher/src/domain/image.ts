import { UpgradeStrategy, ImageSpec } from './types';


export interface ImageRepoConfig {
  imagesToWatch: Array<{
    orgId: string,
    imageName: string,
  }>
}

export default class ImageRepo {
  imagesToWatch: Array<{
    orgId: string,
    imageName: string,
  }>;

  constructor(config: ImageRepoConfig) {
    this.imagesToWatch = config.imagesToWatch;
  }

  async getImage(currentImage: ImageSpec, strategy: UpgradeStrategy): Promise<ImageSpec> {
    console.log('strategy is', strategy)
    // TODO: lookup in database
    // TODO: error handling
    return currentImage
  }
}