import k8s from '@kubernetes/client-node'
import Logger from '@mojaloop/central-services-logger'
import config from '~/shared/config';


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

    const results: Array<ImageSpec | null> = []
    const commands: Array<string | null> = []
    const failures: Array<Error> = []

    await Promise.all(this.deploymentWatchers.map(async w => {
      try {
        const result = await w.getDesiredVersionOrNull()
        results.push(result)

        // make sure to grab command metadata if we need it
        if (config.NOTIFY_KUBECTL_PATCH_INSTRUCTIONS) {
          if (!result) {
            //push nulls so that our 2 arrays line up
            commands.push(null)
          } else {
            const command = await w.getPatchKubectlCommand(result)
            commands.push(command.join('\n'))
          }
        }

        if (config.EXPERIMENTAL_AUTO_UPGRADE_DEPLOYMENTS) {
          // Upgrade the deployments


        }

      } catch (err) {
        Logger.error(`first ClusterWatcher.getLatestAndNotify() - failing for: ${w.serviceToWatch}`)
        failures.push(err)
        Logger.error(err)
      }
    }))

    // cast here since TS can't figure out types after a .filter
    const filteredResults: Array<ImageSpec> = results.filter(r => r) as Array<ImageSpec>
    const filteredCommands: Array<string> = commands.filter(c => c) as Array<string>

    // For our filtered results, if we have NOTIFY_KUBECTL_PATCH_INSTRUCTIONS=true, go back to the
    // deployment watcher, and get some patch metadata
    return this.notifyClient.notifyOperator(filteredResults, filteredCommands, failures)
  }
}
