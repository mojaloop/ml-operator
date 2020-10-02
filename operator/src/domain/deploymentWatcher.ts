import k8s from '@kubernetes/client-node'

import { ImageSpec, UpgradeStrategy } from "./types";
import { ImageWatcherClient } from '../shared/imageWatcherClient'

/**
 * @class DeploymentWatcher
 * @description Watches a single service/deployment and checks if the image(s) are require an update
 */
export default class DeploymentWatcher {
  private k8sClient: k8s.AppsV1Api;
  private serviceToWatch: string;
  private imageWatcherClient: ImageWatcherClient;
  private strategy: UpgradeStrategy;

  constructor(k8sClient: k8s.AppsV1Api, serviceToWatch: string, imageWatcherClient: ImageWatcherClient, strategy: UpgradeStrategy) {
    this.k8sClient = k8sClient
    this.serviceToWatch = serviceToWatch
    this.imageWatcherClient = imageWatcherClient
    this.strategy = strategy
  }

  public async getDesiredVersionOrNull(): Promise<null | ImageSpec> {
    const currentImageSpecs = await this._getCurrentImageSpecsForDeployment();
    return this._getDesiredVersionForImageSpecs(currentImageSpecs)
  }

  public async _getCurrentImageSpecsForDeployment(): Promise<Array<ImageSpec>> {
    const deploymentsResult = await this.k8sClient.listDeploymentForAllNamespaces(false, undefined, undefined, `app.kubernetes.io/name == ${this.serviceToWatch}`)
    const deploymentList = deploymentsResult.body.items
    // TODO: filter out the undefined
    const images = deploymentList.map(item => item?.spec?.template?.spec?.containers[0].image)

    //TODO: map to an image spec
    console.log("got current images", images)

    return []
  }

  // returns null if there is no upgrade available
  public async _getDesiredVersionForImageSpecs(imageSpecs: Array<ImageSpec>): Promise<null | ImageSpec> {
    if (imageSpecs.length === 0) {
      return null;
    }
    
    //todo: only search for the highest version in the list of images
    const highestImage = imageSpecs[0]
    const upgradeResult = await this.imageWatcherClient.getLatestImage(highestImage, this.strategy)
    // TODO: double check this equality
    if (upgradeResult ===  highestImage) {
      // They are the same, no desired image change
      return null;
    }

    return upgradeResult;
  }



}