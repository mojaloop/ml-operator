import { ImageSpec, ImageName } from './types';
import { imageNameAsString } from '~/shared/utils';
import { ImageCacher } from './imageCacher';


export interface RegistryScraperConfig {
  refreshTimeMs: number;
  watchList: Array<ImageName>;
  imageCacher: ImageCacher;

  // Callback function when new images are found
  // onNewImagesFoundFunc: (images: Array<ImageSpec>) => void;
}

export interface WatchCursor {
  imageName: ImageName,
  lastFetchedTimestamp: number | 'never'
}

/**
 * @class RegistryScraper
 * @description A http aware, cahing client for watching docker image registries
 */
export default class RegistryScraper {
  config: RegistryScraperConfig
  private watchMapWithCursor: Map<string, WatchCursor>

  constructor(config: RegistryScraperConfig) {
    this.config = config;
  
    //Build a list of images to scrape, and setup default cursors
    this.watchMapWithCursor =  new Map<string, WatchCursor>()
    this.config.watchList.forEach(imageName => {
      this.watchMapWithCursor.set(imageNameAsString(imageName), { imageName, lastFetchedTimestamp: 'never'})
    })
  }

  //This could be moved elsewhere?
  public async scrapeImage(spec: ImageName): Promise<Array<ImageSpec>> {
    //TODO: API calls, pagination etc.
    return [
      {
        orgId: spec.orgId,
        imageName: spec.imageName,
        tag: 'v11.0.0'
      },
      {
        orgId: spec.orgId,
        imageName: spec.imageName,
        tag: 'v11.1.0'
      },
    ]
  }

  public async scrapeAllImages(): Promise<void> {
    console.log('scraping all images')
    const keys = Array.from(this.watchMapWithCursor.keys())

    await Promise.all(keys.map(async key => {
      const keyCursor = this.watchMapWithCursor.get(key)!
      
      //Get the latest updates
      // TODO: repsect the cursor somehow or something...
      const images = await this.scrapeImage(keyCursor.imageName)

      // Update the cache
      await this.config.imageCacher.appendImages(keyCursor.imageName, images)
    }))
  }

  /**
   * @function startScraping
   * @description Start scraping for the repos defied in the config
   * @returns { () => void } Stop - a function to stop the scraper
   * 
   */
  async startScraping(): Promise<() => void> {
    await this.scrapeAllImages()

    return () => {}
  }
}