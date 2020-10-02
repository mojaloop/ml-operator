import { CronJob } from 'cron'
import k8s from '@kubernetes/client-node'

import { ClusterWatcher } from './domain/clusterWatcher';
import config from './shared/config'
import { ImageWatcherClient } from './shared/imageWatcherClient';
import { SlackNotifyClient } from './shared/notifyClient';


async function main() {
  const kc = new k8s.KubeConfig();
  kc.loadFromCluster();
  const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

  const imageWatcherClient = new ImageWatcherClient(config.IMAGE_WATCHER_CLIENT_URL)
  const slackNotifyClient = new SlackNotifyClient(config.SLACK_WEBHOOK_URL);
  const servicesAndStrategies = config.SERVICES.map(service => ({service, strategy: config.UPGRADE_STRATEGY}))

  const clusterWatcher = new ClusterWatcher(k8sApi, imageWatcherClient, slackNotifyClient, servicesAndStrategies)

  const cronCommand = () => clusterWatcher.getLatestAndNotify()
  const job = new CronJob(config.CHECK_FOR_UPDATE_CRON, cronCommand, null, true);

  job.start();
}

main()
.then(() => {
  console.log(`Started ml-operator watcher service.`)
  console.log(`    Watching for: ${config.SERVICES.length} services`)
  console.log(`    Refreshing every ${config.CHECK_FOR_UPDATE_CRON}`)
})
.catch(err => {
  console.log(err)
})

