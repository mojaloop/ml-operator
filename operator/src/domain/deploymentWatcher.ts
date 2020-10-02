import { ImageSpec, UpgradeStrategy } from "./types";
import { ImageWatcherClient } from '../shared/imageWatcherClient'

/**
 * @class DeploymentWatcher
 * @description Watches a single service/deployment and checks if the image(s) are require an update
 */
export default class DeploymentWatcher {
  private k8sClient: unknown;
  private serviceToWatch: string;
  private imageWatcherClient: ImageWatcherClient;
  private strategy: UpgradeStrategy;

  constructor(k8sClient: unknown, serviceToWatch: string, imageWatcherClient: ImageWatcherClient, strategy: UpgradeStrategy) {
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
    const deploymentsResult = await this.k8sClient.listDeploymentForAllNamespaces(null, null, null, `app.kubernetes.io/name == ${this.serviceToWatch}`)
    const deploymentList = deploymentsResult.body.items
    const images = deploymentList.items.map(item => item.spec.template.spec.containers[0].image)

    //TODO: map to an image spec

    return []
  }

  // returns null if there is no upgrade available
  public async _getDesiredVersionForImageSpecs(imageSpecs: Array<ImageSpec>): Promise<null | ImageSpec> {
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