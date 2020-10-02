import k8s from '@kubernetes/client-node'
import Logger from '@mojaloop/central-services-logger'


import { ImageWatcherClient } from "../shared/imageWatcherClient";
import { NotifyClient } from "../shared/notifyClient";
import DeploymentWatcher from "./deploymentWatcher";
import { ImageSpec, UpgradeStrategy } from "./types";

export type ServiceAndStrategy = {
  //name of the deployment/service
  service: string,
  strategy: UpgradeStrategy
}

/**
 * @class ClusterWatcher
 * @description Watches a set of deployments for image upgrades
 */
export class ClusterWatcher {
  private k8sClient: k8s.AppsV1Api;
  private imageWatcherClient: ImageWatcherClient;
  private notifyClient: NotifyClient;
  private servicesAndStrategies: Array<ServiceAndStrategy>
  private deploymentWatchers: Array<DeploymentWatcher> = []

  constructor(k8sClient: k8s.AppsV1Api, imageWatcherClient: ImageWatcherClient, notifyClient: NotifyClient, servicesAndStrategies: Array<ServiceAndStrategy>) {
    Logger.debug(`ClusterWatcher.constructor() - initializing ClusterWatcher for ${servicesAndStrategies.length} deployments`)
    this.k8sClient = k8sClient
    this.imageWatcherClient = imageWatcherClient
    this.notifyClient = notifyClient;
    this.servicesAndStrategies = servicesAndStrategies

    this.servicesAndStrategies.forEach(serviceAndStrategy => {
      const deploymentWatcher = new DeploymentWatcher(this.k8sClient, serviceAndStrategy.service, this.imageWatcherClient, serviceAndStrategy.strategy)
      this.deploymentWatchers.push(deploymentWatcher)
    })
  }

  public async getLatestAndNotify(): Promise<void> {
    Logger.info(`ClusterWatcher.getLatestAndNotify() - checking ${this.servicesAndStrategies.length} deployments for outdated images`)

    const results = await Promise.all(this.deploymentWatchers.map(async w => await w.getDesiredVersionOrNull()))
    const filteredResults: Array<ImageSpec> = []
    // for some reason, TSLint isn't figuring out the filter properly
    // so let's be explicit
    results.forEach(r => {
      if (r) {
        filteredResults.push(r)
      }
    })

    this.notifyClient.notifyOperator(filteredResults)
  }
}