import { ImageWatcherClient } from "../shared/imageWatcherClient";
import { NotifyClient } from "../shared/notifyClient";
import DeploymentWatcher from "./deploymentWatcher";
import { UpgradeStrategy } from "./types";

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
  private k8sClient: unknown;
  private imageWatcherClient: ImageWatcherClient;
  private notifyClient: NotifyClient;
  private servicesAndStrategies: Array<ServiceAndStrategy>
  private deploymentWatchers: Array<DeploymentWatcher> = []

  constructor(k8sClient: unknown, imageWatcherClient: ImageWatcherClient, notifyClient: NotifyClient, servicesAndStrategies: Array<ServiceAndStrategy>) {
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
    const results = await Promise.all(this.deploymentWatchers.map(async w => await w.getDesiredVersionOrNull()))
    const filteredResults = results.filter(r => !!r)

    this.notifyClient.notifyOperator(filteredResults)
  }
}