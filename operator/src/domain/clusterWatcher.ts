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

    // TODO: instead of ignoring failures, add to a list so we can notify the user
    const results = await Promise.all(this.deploymentWatchers.map(async w => {
      try {
        return await w.getDesiredVersionOrNull()
      } catch (err) {
        Logger.error(`ClusterWatcher.getLatestAndNotify() - failing silently for: ${w.serviceToWatch}`)
        return undefined;
      }
    }))

    // cast here since TS can't figure out types after a .filter
    const filteredResults: Array<ImageSpec> = results.filter(r => r) as Array<ImageSpec>
    return this.notifyClient.notifyOperator(filteredResults)
  }
}
