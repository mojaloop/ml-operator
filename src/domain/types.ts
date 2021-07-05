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

export interface PatchSpecWithMetadata {
  // The spec to update this deployment with
  patchSpec: string
  
  // deployment metadata - a subset of V1ObjectMeta
  metadata: {
    name: string,
    namespace: string,
  },

  // The desired image spec in a structured format
  imageSpec: ImageSpec
}

export interface UpgradeResult {
  successes: Array<PatchSpecWithMetadata>,
  failures: Array<Error>
}
