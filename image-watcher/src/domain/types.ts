export enum UpgradeStrategy {
  PATCH = 'PATCH',
  BUGFIX = 'BUGFIX',
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
}

export interface ImageName {
  orgId: string,
  imageName: string,
}

export interface ImageSpec extends ImageName {
  tag: string,
}