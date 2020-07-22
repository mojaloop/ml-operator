const k8s = require('@kubernetes/client-node');
const CronJob = require('cron').CronJob;
const got = require('got');

const SERVICE_TO_WATCH = "centralledger-service"
const VERSION_CHECKER = "https://version-checker-l36os5e3rq-ew.a.run.app"

// Loads the config from the bound service account
const kc = new k8s.KubeConfig();
kc.loadFromCluster();

const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

const getFilteredDeployments = function () {
  k8sApi.listDeploymentForAllNamespaces(null, null, null, `app.kubernetes.io/name == ${SERVICE_TO_WATCH}`)
    .then((res) => {
      const deploymentList = res.body;
      deploymentList.items.map(item => {

        // Get deployment current image
        const deploymentContainers = item.spec.template.spec.containers;
        const image = deploymentContainers[0].image

        const imageDetails = getImageAndTag(image)

        got.get(VERSION_CHECKER, {
          searchParams: imageDetails,
          responseType: 'json'
        }).then(response => {
          const body = response.body

          // Not the latest version. Notify operator
          if(body.is_latest === false) {
            console.log(`${imageDetails.image} is not up to date! Notifying Operator`)
            notifyOperator(imageDetails.image, body.latest_tag)
          } else {
            console.log(`${imageDetails.image} is up to date!`)
          }
        }).catch(error => {
          console.error(error)
        })
      })
    })
    .catch((err) => {
      console.log(err);
    });
}

function getImageAndTag(imageUrl) {
  const index = imageUrl.indexOf(":")
  return {
    image: SERVICE_TO_WATCH,
    tag: imageUrl.substr(index + 1)
  }
}

function notifyOperator(service, latest_tag) {
  console.warn(`${service} is not on the latest secure version. Please update urgently!`)
  // got.post('https://hooks.slack.com/services/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', {
  //   json: {
  //     text: `\`${service}\` is not on the latest secure version. Please update urgently to \`${latest_tag}\`!`
  //   }
  // })
}

const job = new CronJob('0 * * * * *', function() {
  getFilteredDeployments();
}, null, true);

job.start();
