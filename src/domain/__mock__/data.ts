
import { V1DeploymentList } from "@kubernetes/client-node"
import { IncomingMessage } from 'http'

// Copied from JSON.stringify result against a live cluster
const listDeploymentForAllNamespacesResult: { response: IncomingMessage, body: V1DeploymentList } = {
  response: null as unknown as IncomingMessage,
    body: {
      items: [
        {
          "metadata": {
            "annotations": {
              "deployment.kubernetes.io/revision": "4",
              "field.cattle.io/publicEndpoints": "[{\"addresses\":[\"\\u003cnil\\u003e\"],\"port\":80,\"protocol\":\"HTTP\",\"serviceName\":\"pisp-lab:account-lookup-service-admin\",\"ingressName\":\"pisp-lab:account-lookup-service\",\"path\":\"/account-lookup-service-admin(/|$)(.*)\",\"allNodes\":true},{\"addresses\":[\"\\u003cnil\\u003e\"],\"port\":443,\"protocol\":\"HTTPS\",\"serviceName\":\"pisp-lab:account-lookup-service-admin\",\"ingressName\":\"pisp-lab:account-lookup-service\",\"path\":\"/account-lookup-service-admin(/|$)(.*)\",\"allNodes\":true},{\"addresses\":[\"\\u003cnil\\u003e\"],\"port\":80,\"protocol\":\"HTTP\",\"serviceName\":\"pisp-lab:account-lookup-service\",\"ingressName\":\"pisp-lab:account-lookup-service\",\"path\":\"/account-lookup-service(/|$)(.*)\",\"allNodes\":true},{\"addresses\":[\"\\u003cnil\\u003e\"],\"port\":443,\"protocol\":\"HTTPS\",\"serviceName\":\"pisp-lab:account-lookup-service\",\"ingressName\":\"pisp-lab:account-lookup-service\",\"path\":\"/account-lookup-service(/|$)(.*)\",\"allNodes\":true}]"
            },
            "creationTimestamp": new Date(),
            "generation": 67,
            "labels": {
              "app": "account-lookup-service",
              "app.kubernetes.io/name": "account-lookup-service"
            },
            "name": "account-lookup-service",
            "namespace": "pisp-lab",
            "resourceVersion": "21415617",
            "selfLink": "/apis/apps/v1/namespaces/pisp-lab/deployments/account-lookup-service",
            "uid": "f7df4cc1-1988-4aa3-95a9-77ff611e6b6f"
          },
          "spec": {
            "progressDeadlineSeconds": 600,
            "replicas": 1,
            "revisionHistoryLimit": 10,
            "selector": {
              "matchLabels": {
                "app": "account-lookup-service"
              }
            },
            "strategy": {
              "rollingUpdate": {
                // @ts-ignore
                "maxSurge": 1,
                // @ts-ignore
                "maxUnavailable": "25%"
              },
              "type": "RollingUpdate"
            },
            "template": {
              "metadata": {
                // @ts-ignore
                "creationTimestamp": null,
                "labels": {
                  "app": "account-lookup-service"
                }
              },
              "spec": {
                "containers": [
                  {
                    "env": [
                      {
                        "name": "ALS_SWITCH_ENDPOINT",
                        "value": "http://central-ledger:3001"
                      },
                      {
                        "name": "ALS_DATABASE__HOST",
                        "value": "mysql-als"
                      }
                    ],
                    "image": "mojaloop/account-lookup-service:v10.3.1",
                    "imagePullPolicy": "IfNotPresent",
                    "livenessProbe": {
                      "failureThreshold": 3,
                      "httpGet": {
                        "path": "/health",
                        // @ts-ignore
                        "port": 4001,
                        "scheme": "HTTP"
                      },
                      "initialDelaySeconds": 30,
                      "periodSeconds": 10,
                      "successThreshold": 1,
                      "timeoutSeconds": 1
                    },
                    "name": "account-lookup-service",
                    "readinessProbe": {
                      "failureThreshold": 3,
                      "httpGet": {
                        "path": "/health",
                        // @ts-ignore
                        "port": 4001,
                        "scheme": "HTTP"
                      },
                      "initialDelaySeconds": 30,
                      "periodSeconds": 10,
                      "successThreshold": 1,
                      "timeoutSeconds": 1
                    },
                    "resources": {},
                    "terminationMessagePath": "/dev/termination-log",
                    "terminationMessagePolicy": "File"
                  }
                ],
                "dnsPolicy": "ClusterFirst",
                "restartPolicy": "Always",
                "schedulerName": "default-scheduler",
                "securityContext": {},
                "terminationGracePeriodSeconds": 30
              }
            }
          },
          "status": {
            "availableReplicas": 1,
            "conditions": [
              {
                // @ts-ignore
                "lastTransitionTime": "2020-10-16T04:38:44.000Z",
                // @ts-ignore
                "lastUpdateTime": "2020-10-16T04:38:44.000Z",
                "message": "Deployment has minimum availability.",
                "reason": "MinimumReplicasAvailable",
                "status": "True",
                "type": "Available"
              },
              {
                // @ts-ignore
                "lastTransitionTime": "2020-10-16T03:57:59.000Z",
                // @ts-ignore
                "lastUpdateTime": "2020-10-16T04:43:17.000Z",
                "message": "ReplicaSet \"account-lookup-service-579b64f6f4\" has successfully progressed.",
                "reason": "NewReplicaSetAvailable",
                "status": "True",
                "type": "Progressing"
              }
            ],
            "observedGeneration": 67,
            "readyReplicas": 1,
            "replicas": 1,
            "updatedReplicas": 1
          }
        }
      ]
  }
}


export { listDeploymentForAllNamespacesResult }
