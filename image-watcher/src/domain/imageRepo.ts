import { UpgradeStrategy, ImageSpec } from './types';
import { ImageCacher } from './imageCacher';


export interface ImageRepoConfig {
  imageCacher: ImageCacher,
}


const semanticSplit = (tag: string): { MAJOR: string, MINOR: string, BUGFIX: string, PATCH: string } => {
  const [MAJOR, MINOR, BUGFIX, PATCH] = tag.split('.')

  return {
    MAJOR,
    MINOR,
    BUGFIX,
    PATCH
  }
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

  async getImage(currentImage: ImageSpec, strategy: UpgradeStrategy): Promise<ImageSpec> {
    //Get image from cacher
    const imagesList = await this.config.imageCacher.getImages(currentImage)

    if (strategy === UpgradeStrategy.MAJOR || strategy === UpgradeStrategy.MINOR) {
      throw new Error(`Unsupported upgrade stategy: ${strategy}`)
    }

    // TODO: smarter parsing
    const { MAJOR: currMajor, MINOR: currMinor, BUGFIX: currBugfix, PATCH: currPatch} = semanticSplit(currentImage.tag)
    console.log(currMajor, currMinor, currBugfix, currPatch)

    const allPatchImages = imagesList.filter(img => {
      const { MAJOR, MINOR, BUGFIX } = semanticSplit(img.tag)
      // TODO: Wow this is ugly... but seems to work
      if (MAJOR !== currMajor) {
        if (strategy === UpgradeStrategy.PATCH || strategy === UpgradeStrategy.BUGFIX || strategy === UpgradeStrategy.MINOR) {
          return false
        }
        return true
      }
      if (MINOR !== currMinor) {
        if (strategy === UpgradeStrategy.PATCH || strategy === UpgradeStrategy.BUGFIX) {
          return false
        }
        return true
      }
      if (BUGFIX !== currBugfix) {
        if (strategy === UpgradeStrategy.PATCH) {
          return false
        }
        return true;
      }
      return true
    })

    console.log('all patch images', allPatchImages)
    if (allPatchImages.length === 0) {
      throw new Error(`Invalid image supplied: ${JSON.stringify(currentImage)}`)
    }
    //TODO: sort and get the biggest
    
    return allPatchImages[0]
  }
}