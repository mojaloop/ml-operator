import { UpgradeStrategy, ImageSpec } from './types';
import { ImageCacher } from './imageCacher';
import { semanticSplit, semanticSort } from '~/shared/utils';
import Logger from '@mojaloop/central-services-logger';


export interface ImageCalculatorConfig {
  imageCacher: ImageCacher,
}

/**
 * @class ImageCalculator
 * @description Calculates the next image based on the current image, the scraped images, and an upgrade strategy
 */
export default class ImageCalculator {
  private config: ImageCalculatorConfig;

  constructor(config: ImageCalculatorConfig) {
    this.config = config
  }

  async getImage(currentImage: ImageSpec, strategy: UpgradeStrategy): Promise<ImageSpec> {
    //Get image from cacher
    const imagesList = await this.config.imageCacher.getImages(currentImage)
    const { MAJOR: currMajor, MINOR: currMinor, BUGFIX: currBugfix } = semanticSplit(currentImage.tag)

    const allPatchImages = imagesList.filter(img => {
      let MAJOR, MINOR, BUGFIX
      try {
        const splits = semanticSplit(img.tag);
        MAJOR = splits.MAJOR
        MINOR = splits.MINOR
        BUGFIX = splits.BUGFIX
      } catch (err) {
        Logger.warn(`ImageCalculator.getImage, error parsing image, ${img.tag}`)
        Logger.debug(err)
        return
      }

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

    if (allPatchImages.length === 0) {
      throw new Error(`Invalid image supplied: ${JSON.stringify(currentImage)}`)
    }

    //Sort and get the biggest
    allPatchImages.sort(semanticSort)
    return allPatchImages[0]
  }
}
