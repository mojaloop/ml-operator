const k8s = require('@kubernetes/client-node');
const CronJob = require('cron').CronJob;

// Loads the config from the bound service account
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.AppsV1Api);


const getPods = function () {
  k8sApi.listDeploymentForAllNamespaces()
    .then((res) => {
      const deploymentList = res.body;
      deploymentList.items.map(item => {
        const deploymentContainers = item.spec.template.spec.containers;
        const image = deploymentContainers[0].image
        console.log(image)
      })
      // console.log(res.body);
    })
    .catch((err) => {
      console.log(err);
    });
}

getPods();

// const job = new CronJob('0 * * * * *', function() {
//   getPods();
//   console.log('You will see this message every second');
// }, null, true);
//
// job.start();
