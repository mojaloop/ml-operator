import { ImageSpec } from '~/domain/types';
// import got from 'got'

//@ts-ignore
import dockerHubAPI from 'docker-hub-api'


export interface PaginatedResult<T> {
  count: number
  next: number | null
  previous: number | null
  results: T
}
export interface DockerHubApiImage { 
  creator: number,
  id: number,
  image_id: any,
  last_updated: string
  last_updater: number
  last_updater_username: string
  name: string
  repository: number
  full_size: number,
  v2: true
}


export interface RegistryClientConfig {
  // registry.docker.io
  // authService: string
  // https://auth.docker.io
  // authServiceBaseUrl: string
  // https://registry-1.docker.io/v2
  // registryBaseUrl: string,
  cacheResults: false | number
}

/**
 * @class RegistryClient
 * @description RegistryClient is a docker hub/registry client used to pull images
 *   Currently, only the public docker registry is supported, and there are some quirks
 *   that the public docker registry doesn't conform to it's own api...
 */
export class RegistryClient {
  private config: RegistryClientConfig;

  constructor (config: RegistryClientConfig) {
    this.config = config;

    if (this.config.cacheResults) {
      dockerHubAPI.setCacheOptions({
        enabled: true,
        time: this.config.cacheResults
      })
    }
  }

  public async getTagsForImage(user: string, image: string): Promise<Array<ImageSpec>> {
    console.log('getTagsForImage', user, image)
    const result: PaginatedResult<Array<DockerHubApiImage>> | Array<DockerHubApiImage> = await dockerHubAPI.tags(user, image)
    const imageList: Array<DockerHubApiImage> = !Array.isArray(result) ? result.results : result
    console.log('getTagsForImage found', imageList.length, 'images')

    const images: Array<ImageSpec> = imageList.map(img => ({
      orgId: user,
      imageName: image,
      tag: img.name
    }))

    return images
  }

}