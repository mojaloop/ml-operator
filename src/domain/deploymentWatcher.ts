import k8s  from '@kubernetes/client-node'

import { ImageSpec, UpgradeStrategy } from "./types";
import { ImageWatcherClient } from '../shared/imageWatcherClient'
import { imageSpecToString, imageStringToSpec } from '~/shared/util';
import Logger from '@mojaloop/central-services-logger';

/**
 * @class DeploymentWatcher
 * @description Watches a single service/deployment and checks if the image(s) are require an update
 */
export default class DeploymentWatcher {
  public serviceToWatch: string;
  private k8sClient: k8s.AppsV1Api;
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

  /**
   * @function getPatchMessageMetadata
   * @description For a given image, print out a patch JSON string to update the deployment to that image
   * @param newImage: { ImageSpec } - the new image to patch the deployment to
   * @returns Array<string> - A list of shell commands to run in order to patch deployment
   */
  public async getPatchMessageMetadata(newImage: ImageSpec): Promise<Array<string>> {
    // TODO: how do we handle deployments with multiple containers? I guess we just filter out for
    // the relevant container?

    // TODO Worry about simple case first, then on the bigger helm chart
    const deploymentsResult = await this.k8sClient.listDeploymentForAllNamespaces(false, undefined, undefined, `app.kubernetes.io/name == ${this.serviceToWatch}`)
    const deploymentList = deploymentsResult.body.items

    if (deploymentList.length === 0) {
      console.log('getPatchMessageMetadata failing with no deployment. serviceToWatch is', this.serviceToWatch)
      throw new Error(`getPatchMessageMetadata could not find deployment for label: 'app.kubernetes.io/name == ${ this.serviceToWatch }'`)
    }

    const templates: Array<string> = deploymentList.map(deployment => {
      const deploymentName = deployment.metadata?.name
      // Iterate through the containers, and apply the updates to the relevant containers in the deployment
      // 99% of the time, this will just be one container in the deployment that matches, but who knows?
      const containersToApply = deployment.spec?.template.spec?.containers.filter(container => {
        const currentSpec = imageStringToSpec(container.image!)
        // skip images that are not relevant to what should be patched
        if (newImage.imageName === currentSpec.imageName && newImage.orgId === currentSpec.orgId) {
          // Throw an error - clearly something is wrong if we are trying to not upgrade
          if (newImage.tag === currentSpec.tag) {
            throw new Error('getPatchMessageMetadata, tried to generate a new patch message, but new image is not an upgrade')
          }
          return true
        }

        return false
      })
      .map(container => ({name: container.name, image: imageSpecToString(newImage)}))
      const patchSpec = `'{"spec": {"template": {"spec": {"containers": ${JSON.stringify(containersToApply)}}}}}'`

      // e.g. kubectl patch deployment account-lookup-service --patch '{"spec": {"template": {"spec": {"containers": [{"name": "account-lookup-service", "image": "mojaloop/account-lookup-service:v10.3.1"}]}}}}'
      return `kubectl patch deployment ${deploymentName} --patch ${patchSpec}`
    })


    return templates
  }

  public async _getCurrentImageSpecsForDeployment(): Promise<Array<ImageSpec>> {
    Logger.debug(`DeploymentWatcher._getCurrentImageSpecsForDeployment - getting deployments for label 'app.kubernetes.io/name == ${this.serviceToWatch}'`)
    try {
      // TODO: make this label configurable
      const deploymentsResult = await this.k8sClient.listDeploymentForAllNamespaces(false, undefined, undefined, `app.kubernetes.io/name == ${this.serviceToWatch}`)
      const deploymentList = deploymentsResult.body.items

      /* istanbul ignore next */
      const images = deploymentList
        .map(item => item?.spec?.template?.spec?.containers[0].image)
        .filter(i => i !== undefined) as string[]

      const imageSpecs = images.map(i => imageStringToSpec(i))

      return imageSpecs
    } catch (err) {
      Logger.error(`DeploymentWatcher._getCurrentImageSpecsForDeployment - failed for service: ${this.serviceToWatch}'`)
      Logger.error(err)
      throw err
    }
  }

  // returns null if there is no upgrade available
  public async _getDesiredVersionForImageSpecs(imageSpecs: Array<ImageSpec>): Promise<null | ImageSpec> {
    if (imageSpecs.length === 0) {
      return null;
    }

    // todo: only search for the highest version in the list of images
    // at the moment, this is a random list of image specs inside a given deployment
    const highestImage = imageSpecs[0]
    const upgradeResult = await this.imageWatcherClient.getLatestImage(highestImage, this.strategy)
    if (upgradeResult.tag ===  highestImage.tag) {
      // They are the same, no desired image change
      return null;
    }

    return upgradeResult;
  }



}
