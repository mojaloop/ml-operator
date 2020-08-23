import { KVS } from '~/shared/kvs';
import { ImageSpec, ImageName } from './types';
import { imageNameAsString } from '~/shared/utils';


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

    const combined = existing.concat(newImages)
    //TODO: some fancy ordering by semantic version

    await this.set(plainImageName, combined)
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