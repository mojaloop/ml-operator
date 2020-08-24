import { KVS } from '~/shared/kvs';
import { ImageSpec, ImageName } from './types';
import { imageNameAsString, semanticSort, semanticSplit } from '~/shared/utils';
import Logger from '@mojaloop/central-services-logger';


/**
 * @class ImageCacher
 * @description ImageCacher is a redis aware cache of all the images and their tags
 */
export class ImageCacher extends KVS {

  /**
   * @function appendImages
   * @description Add images to the redis cache for a given tag.
   * @param images
   */
  public async appendImages(imageName: ImageName, newImages: Array<ImageSpec>): Promise<void> {
    const plainImageName = imageNameAsString(imageName)
    const existing = await this.get<Array<ImageSpec>>(plainImageName) || []

    // Deduplicate the old and new lists
    const dedupMap: {[index: string]: ImageSpec} = {}
    existing.forEach(image => dedupMap[image.tag] = image)
    newImages.forEach(image => dedupMap[image.tag] = image)
    let combinedDedupedList = Object.keys(dedupMap).map(key => {
      const image = dedupMap[key];
      return image;
    })

    // Remove any badly formatted images
    const filteredList = combinedDedupedList.filter(img => {
      try {
        // If it splits, then the format is fine
        semanticSplit(img.tag)
      } catch (err) {
        return false
      }

      return true
    })
    // Sort by semantic versioning
    .sort(semanticSort)


    Logger.debug(`ImageCacher.appendImages - saved ${plainImageName} with ${filteredList.length} images`)
    await this.set(plainImageName, filteredList)
  }

  public async getImages(imageName: ImageName): Promise<Array<ImageSpec>> {
    const plainImageName = imageNameAsString(imageName)
    const existing = await this.get<Array<ImageSpec>>(plainImageName)
    if (!existing) {
      throw new Error(`Image not found in cache: ${plainImageName}`)
    }

    return existing;
  }

}
