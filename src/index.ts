import { CronJob } from 'cron'
import { KubeConfig, AppsV1Api }from '@kubernetes/client-node'
import Logger from '@mojaloop/central-services-logger'

import { ClusterWatcher } from './domain/clusterWatcher';
import config from './shared/config'
import { ImageWatcherClient } from './shared/imageWatcherClient';
import { NoopNotifyClient, SlackNotifyClient } from './shared/notifyClient';

async function main() {
  const kc = new KubeConfig();
  if (config.SHOULD_USE_DEFAULT_K8S) {
    // running locally - use the ~/.kube/config file
    kc.loadFromDefault();
  } else {
    // running on the cluster - no config file
    kc.loadFromCluster();
  }
  const k8sApi = kc.makeApiClient(AppsV1Api);

  if (config.EXPERIMENTAL_AUTO_UPGRADE_DEPLOYMENTS) {
    Logger.warn('EXPERIMENTAL_AUTO_UPGRADE_DEPLOYMENTS is true. This is an experimental\
    feature, and should not be used for production environments.')
  }

  const imageWatcherClient = new ImageWatcherClient(config.IMAGE_WATCHER_CLIENT_URL)
  let slackNotifyClient = new NoopNotifyClient()
  if (config.NOTIFY_KUBECTL_PATCH_INSTRUCTIONS) {
    slackNotifyClient = new SlackNotifyClient(config.SLACK_WEBHOOK_URL);
  }
  const servicesAndStrategies = config.SERVICES.map(service => ({service, strategy: config.UPGRADE_STRATEGY}))

  const clusterWatcher = new ClusterWatcher(k8sApi, imageWatcherClient, slackNotifyClient, servicesAndStrategies)
  // Run on start - so we don't need to wait for the cron
  clusterWatcher.getLatestAndNotify()

  const cronCommand = () => clusterWatcher.getLatestAndNotify()
  const job = new CronJob(config.CHECK_FOR_UPDATE_CRON, cronCommand, null, true);

  job.start();
}

main()
.then(() => {
  Logger.info(`Started ml-operator watcher service.`)
  Logger.info(`    Watching for: ${config.SERVICES.length} services`)
  Logger.info(`    Refreshing every ${config.CHECK_FOR_UPDATE_CRON}`)
})
.catch(err => {
  Logger.error(`ml-operator encountered fatal error:`)
  Logger.error(err)
  process.exit(1)
})

