import { UpgradeStrategy, ImageSpec } from './types';


export interface ImageRepoConfig {
  watchList: Array<{
    orgId: string,
    imageName: string,
  }>
}

/**
 * @class ImageRepo
 * @description Maintains a list of watched images
 */
export default class ImageRepo {
  // TODO: make this just a simple map with an array...
  // A nested map of orgs, images, available tags
  /*
  {
    mojaloop: {
      central-ledger: [
        v10.1.0
        v10.4.0
      ]
      ml-api-adapter: []
    }
    org2: {
      ...
    }
  }
  */
  orgImages: Map<string, Map<string, Array<string>>>
  watchList: Array<{
    orgId: string,
    imageName: string,
  }>;

  constructor(config: ImageRepoConfig) {
    this.watchList = config.watchList;

    this.orgImages = new Map<string, Map<string, Array<string>>>()
    // Add org roots
    this.watchList.forEach(img => {
      if (!this.orgImages.has(img.orgId)) { 
        this.orgImages.set(img.orgId, new Map<string, Array<string>>())
      }
    })

    // Add image leaves
    this.watchList.forEach(img => {
      const orgMap = this.orgImages.get(img.orgId)
      // TODO: make more elegant
      if (!orgMap) {
        throw new Error('Orgmap not found but just set!')
      }
      orgMap.set(img.imageName, [])
    })

    console.log(this.orgImages)
  }



  // scrapeRegistry() {

  // }

  /**
   * @function startWathing
   * @description Start watching image registry for image updates
   */
  startWatching() {


  }

  /**
   * @function stopWatching
   * @description Stop watching the image registry for updates
   */
  stopWatching() {

  }



  async getImage(currentImage: ImageSpec, _strategy: UpgradeStrategy): Promise<ImageSpec> {
    const org = this.orgImages.get(currentImage.orgId)
    if (!org) {
      throw new Error(`org ${currentImage.orgId} not being watched`)
    }

    const allImages = org.get(currentImage.imageName)
    if (!allImages) {
      throw new Error(`org ${currentImage.orgId} + image: ${currentImage.imageName} not being watched`)
    }
    if (allImages.length === 0) {
      throw new Error(`no images found for ${currentImage.orgId}/${currentImage.imageName}`)
    }


    // TODO: error handling
    return currentImage
  }
}