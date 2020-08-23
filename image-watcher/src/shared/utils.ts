import { ImageName } from '~/domain/types';

export function imageNameAsString (spec: ImageName) {
  return `${spec.orgId}/${spec.imageName}`
}