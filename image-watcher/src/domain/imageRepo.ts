import { UpgradeStrategy, ImageSpec, ImageName } from './types';
import { ImageCacher } from './imageCacher';


export interface ImageRepoConfig {
  imageCacher: ImageCacher,
}

/**
 * @class ImageRepo
 * @description Maintains a list of watched images
 */
export default class ImageRepo {
  private config: ImageRepoConfig;

  constructor(config: ImageRepoConfig) {
    this.config = config
  }

 


  async getImage(currentImage: ImageName, _strategy: UpgradeStrategy): Promise<ImageSpec> {
    //Get image from cacher
    const imagesList = await this.config.imageCacher.getImages(currentImage)

    // TODO: build imagesList into smart, semantic aware list and filter through

    return imagesList[0]
  }
}