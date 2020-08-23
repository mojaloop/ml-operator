import { UpgradeStrategy, ImageSpec } from './types';
import { ImageCacher } from './imageCacher';


export interface ImageRepoConfig {
  imageCacher: ImageCacher,
}

const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')

// Make a lexicographically sortable tag
const semanticSortable = (tag: string): string => {
  const { MAJOR, MINOR, BUGFIX, PATCH } = semanticSplit(tag)
  const bugfixSplit = BUGFIX.split('-')
  // TODO Handle patch tags better...

  const majorInt = parseInt(MAJOR.replace('v', ''))
  const minorInt = parseInt(MINOR)
  const bugfixInt = parseInt(bugfixSplit[0])
  const bugfixSuffix = bugfixSplit.length > 1 ? `-${bugfixSplit[1]}` : ''
  const patchInt = parseInt(PATCH)

  return `${zeroPad(majorInt, 4)}.${zeroPad(minorInt, 4)}.${zeroPad(bugfixInt, 4)}${bugfixSuffix}.${zeroPad(patchInt, 4)}`
}

const semanticSplit = (tag: string): { MAJOR: string, MINOR: string, BUGFIX: string, PATCH: string } => {
  const [MAJOR, MINOR, BUGFIX, PATCH] = tag.split('.')

  if (!MAJOR || !MINOR || !BUGFIX) {
    throw new Error("Couldn't parse tag")
  }

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
    const { MAJOR: currMajor, MINOR: currMinor, BUGFIX: currBugfix } = semanticSplit(currentImage.tag)

    const allPatchImages = imagesList.filter(img => {
      let MAJOR, MINOR, BUGFIX
      try {
        const splits = semanticSplit(img.tag);
        MAJOR = splits.MAJOR
        MINOR = splits.MINOR
        BUGFIX = splits.BUGFIX
      } catch (err) {
        console.log(`Error parsing image: ${img.tag}`)
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
    allPatchImages.sort((a, b) => {
      const sortableTagA = semanticSortable(a.tag)
      const sortableTagB = semanticSortable(b.tag)

      if (sortableTagA === sortableTagB) {
        return 0
      }

      return sortableTagA < sortableTagB ? 1 : -1
    })

    console.log('sorted patch images', allPatchImages.map(img => img.tag))

    return allPatchImages[0]
  }
}