import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi'
import { ImageSpec, UpgradeStrategy } from '~/domain/types'
import { AppContext } from '~/server/create'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function get(_context: any, request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const { imageRepo } = request.server.app as AppContext
  const { org, image, tag } = request.params as { org: string, image: string, tag: string}

  // TODO: make into standalone parser util
  const strategyParser = (strategy: Array<string> | string | undefined, defaultValue: UpgradeStrategy) => {
    if (!strategy) {
      return defaultValue
    }
    let strategyString: string
    if (Array.isArray(strategy)) {
      if (strategy.length !== 1) {
        return defaultValue
      }
      strategyString = strategy[0]
    } else {
      strategyString = strategy
    }

    switch(strategyString) {
      case 'patch' : return UpgradeStrategy.PATCH
      case 'bugfix' : return UpgradeStrategy.BUGFIX
      case 'minor' : return UpgradeStrategy.MINOR
      case 'major' : return UpgradeStrategy.MAJOR
      // This shouldn't be possible
      default: return defaultValue
    }
  }

  const strategy: UpgradeStrategy = strategyParser(request.query.strategy, UpgradeStrategy.BUGFIX) 

  // Map to domain type
  const currentImage: ImageSpec = {
    orgId: org,
    imageName: image,
    tag
  }

  const nextImage = await imageRepo.getImage(currentImage, strategy)
  // TODO error handling - 404, 500 etc...

  // Map back to DTO
  const imageResponse = {
    tag: nextImage.tag,
    fullImage: `${nextImage.orgId}/${nextImage.imageName}:${nextImage.tag}`
  }
  return h.response(imageResponse).code(200)
}

export default {
  get
}