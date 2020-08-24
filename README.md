# ml-operator
A Kubernetes operator for Mojaloop

## Scope:

To begin with, the Mojaloop-Operator handles only 1 feature: To alert operators about available security patches.

## Background
A Mojaloop Helm release uses specific versions of core and supporting services that make up the Mojaloop Hub. Typically this is then enriched with enhancements, more services by implementers with custom config and additional security mechanisms.

With the versioning convention Mojaloop uses, a Docker image has a version for every service with a version `x.y.z`. For example, the `mojaloop/quoting-service` service has an image on DockerHub with version `v10.4.0`. However, once this is published, there may be enhancements to functionality and there will be subsequent releases such as `v10.4.1` or `v10.5.0` or `v10.6.0`, etc.

However, if there is a security vulnerability identified in an already published image, say `v10.4.0`. A patched version of this image with just an upgraded version of that particular dependency or package to address the vulnerability is then released as an image with tag `v10.4.0.1-patch`. Subsequent patched versions of this same image without change functionality will continue incrementing the `p` variable in the `x.y.z.p-patch` version. 

This way, for a given image with specific functionality, images containing patches for vulnerabilities identified can be maintained. One other advantage of this method is that images are never overwritten, so in case there are issues even with patched versions, rollbacks can be performed easily without disrupting functionality and other implementers.

### Pactched images and notifications

To make it easier for Hub Operators to (upgrade and) use these patched images for obvious security, the versioning team proposes using a ‘Kubernetes Operator’ (a native k8s capability) to prompt Hub Operators (or maintainers) of latest patched images available for specific service versions and then upgrading them if so chosen by the Hub Operator (This second part of updating images, will be a roadmap item).


## Packages

- [`operator`](./operator) the Mojaloop Operator
- [`image-watcher`](./image-watcher) a standalone service for watching Docker Hub for any given images, caching those results, and calculating new image versions based on a current version + versioning strategy

## Roadmap

### `v1.0`

- [ ] Slack notification about an patched image version available
- [ ] Standalone service for watching Docker Hub for new tags for a given set of images


### `v1.1`

- [ ] Automated patching (pull the new image and upgrade) - if approved by a Hub Operator / Tech Ops
- [ ] Configurable upgrade windows (based on standard `cron` syntax)
