# Notifications about patched images and automated updates

### Goal
The goal is to do an initial PoC and present to the Community and stakeholders and then standardize it across all services, once it is accepted and finalized.

### Background
A Mojaloop Helm release uses specific versions of core and supporting services that make up the Mojaloop Hub. Typically this is then enriched with enhancements, more services by implementers with custom config and additional security mechanisms.

With the versioning convention Mojaloop uses, a docker image has a version for every service with a version x.y.z. For example, a quoting-service has an image on DockerHub with version v10.4.0. However, once this is published, there may be enhancements to functionality and there will be subsequent releases such as v10.4.1 or v10.5.0 or v10.6.0, etc.

However, if there is a security vulnerability identified in an already published image, say v10.4.0. A patched version of this image with just an upgraded version of that particular dependency or package to address the vulnerability is then released as an image with tag “v10.4.0.1-patch”. Subsequent patched versions of this same image without change functionality will continue incrementing the ‘p’ variable in the x.y.z.p-patch version. This way, for a given image with specific functionality, images containing patches for vulnerabilities identified till date can be maintained. One other advantage of this method is that images are never overwritten, so in case there are issues even with patched versions, rollbacks can be performed easily without disrupting functionality and other implementers.

### Pactched images and notifications
To make it easier for Hub Operators to (upgrade and) use these patched images for obvious security , the versioning team proposes using a ‘controller’ (a native k8s capability) to prompt Hub Operators (or maintainers) of latest patched images available for specific service versions and then upgrading them if so chosen by the Hub Operator.

### Two primary functions

Notification about an patched image version available - can be slack notification
Automated patching (pull the new image and upgrade) - if approved by a Hub Operator / Tech Ops
