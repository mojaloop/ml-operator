# ml-operator
A Kubernetes operator for Mojaloop
## Scope:

To begin with, the Mojaloop-Operator handles only one feature: Alert Switch/Hub Operators about available security patches.

## Background

A Mojaloop Helm release uses specific versions of core and supporting services that make up the Mojaloop Hub. Typically this is then enriched with enhancements, more services by implementers with custom config and additional security mechanisms.

With the versioning convention Mojaloop uses, a Docker image has a version for every service with a version `x.y.z`. For example, the `mojaloop/quoting-service` service has an image on DockerHub with version `v10.4.0`. However, once this is published, there may be enhancements to functionality and there will be subsequent releases such as `v10.5.0` or `v10.6.0` or `v11.0.0`, etc.

However, if there is a security vulnerability identified in an already published image or a fix, say `v10.4.0`. A patched version of this image with just an upgraded version of that particular dependency or package to address the vulnerability is then released as an image with tag `v10.4.1`. Subsequent patched versions of this same image without change functionality will continue incrementing the `z` variable in the `x.y.z` version. 

This way, for a given image with specific functionality, images containing patches for vulnerabilities identified or fixes can be maintained. One other advantage of this method is that images are never overwritten, so in case there are issues even with patched versions, rollbacks can be performed easily without disrupting functionality and other implementers. This simplifies the process as well.

### Pactched images and notifications

To make it easier for Hub Operators to (upgrade and) use these patched images for obvious security, the versioning team proposes using a ‘Kubernetes Operator’ (a native k8s capability) to prompt Hub Operators (or maintainers) of latest patched images available for specific service versions and then upgrading them if so chosen by the Hub Operator (This second part of updating images, will be a roadmap item).


## Running Locally


```bash
export SLACK_WEBHOOK_URL=<your slack webhook URL>

# run the image watcher service
cd ../image-watcher # or wherever your image watcher is cloned
docker-compose up

# now run the notifier service
npm run dev
```

## Deploying to a cluster with `helm` and `kubectl`

TODO: change to refer to helm repo

Helm charts are located in `./charts`

> Note: Helm charts are moving upstream to mojaloop/helm
> and won't be mainainted here any longer.
> refer [here](https://github.com/mojaloop/helm) instead.


```bash
cp ./charts/.env.example ./charts/.env

# fill in the .env file with the appropriate values

# install the charts - if running the first time, it will create the secrets based on the .env file
make install

kubectl get po
```


## Roadmap

### `v1.0`

- [x] Slack notification about an patched image version available
- [x] Standalone service for watching Docker Hub for new tags for a given set of images
- [x] available on mojaloop/helm - https://github.com/mojaloop/helm/pull/417


### `v1.1`

- [ ] Automated patching (pull the new image and upgrade) - if approved by a Hub Operator / Tech Ops
- [ ] Configurable upgrade windows (based on standard `cron` syntax)


## The Slack upgrade notification

For `v1.0` of the operator, instead of directly upgrading the running deployments, the operator simply gives you instructions on how to do so yourself. 

Since every environment is unique, and the `helm values` files are also unique, it's hard to generate an updated `values.yml` file with the new image tags in an automated fashion. For this reason, we decided to output `kubectl patch` commands instead of `helm upgrade` commands with new `values.yml` files.


Moreover, it's rather difficult for the ml-operator to load the values file dynamically from within the cluster


Here's an example command to update the name of a container within a deployment:
```bash
kubectl patch deployment account-lookup-service --patch '{"spec": {"template": {"spec": {"containers": [{"name": "account-lookup-service", "image": "mojaloop/account-lookup-service:v10.3.1"}]}}}}'
```



