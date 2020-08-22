export enum UpgradeStrategy {
  PATCH = 'PATCH',
  BUGFIX = 'BUGFIX',
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
}


export interface ImageSpec {
  orgId: string,
  imageName: string,
  tag: string,
}