import { ImageSpec } from '~/domain/types';


export function imageStringToSpec(image: string): ImageSpec {
  //e.g. mojaloop/account-lookup-service:v10.3.0.2-pisp
  const imageRegex = /(.*)\/(.*)\:(.*)/
  const result  = imageRegex.exec(image)

  if (!result || result.length < 4) {
    throw new Error(`Invalid image string: ${image}`)
  }

  // @ts-ignore
  return {
    orgId: result[1],
    imageName: result[2],
    tag: result[3],
  }
}

export function imageSpecToString(spec: ImageSpec): string {
  return `${spec.orgId}/${spec.imageName}:${spec.tag}`
}
