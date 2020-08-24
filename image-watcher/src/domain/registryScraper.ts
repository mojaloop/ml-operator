import { ImageSpec, ImageName } from './types';
import { imageNameAsString } from '~/shared/utils';
import { ImageCacher } from './imageCacher';
import { RegistryClient } from '~/shared/registryClient';
import Logger from '@mojaloop/central-services-logger';


export interface RegistryScraperConfig {
  refreshTimeMs: number;
  watchList: Array<ImageName>;
  imageCacher: ImageCacher;
  registryClient: RegistryClient
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
    return await this.config.registryClient.getTagsForImage(spec.orgId, spec.imageName)
  }

  public async scrapeAllImages(): Promise<void> {
    const keys = Array.from(this.watchMapWithCursor.keys())

    await Promise.all(keys.map(async key => {
      const keyCursor = this.watchMapWithCursor.get(key)!

      // Get the latest updates
      // TODO: repsect the cursor somehow or something...
      // Maybe we don't need to do this - the pagination doesn't work on docker hub
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
  async startScraping(refreshTimeMs: number): Promise<() => void> {
    Logger.info('RegistryScraper.startScraping() - performing a new scrape')
    await this.scrapeAllImages()

    setTimeout(() => this.startScraping(refreshTimeMs), refreshTimeMs)

    // TODO: some way to cancel this whole thing...
    return () => {}
  }
}
