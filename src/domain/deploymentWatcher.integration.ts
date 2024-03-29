import { AppsV1Api, KubeConfig } from "@kubernetes/client-node";
import DeploymentWatcher from './deploymentWatcher';
import { ImageWatcherClient } from '../shared/imageWatcherClient'
import { ImageSpec, UpgradeStrategy } from './types';

jest.mock('../shared/imageWatcherClient')

const kc = new KubeConfig();
// running locally - use the ~/.kube/config file
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(AppsV1Api);
const imageWatcherClient = new ImageWatcherClient('localhost:4000')

describe('deploymentWatcher', () => {
  describe('tmp_getPatchMessageMetadata', () => {
    it('gets the patch message metadata', async () => {
      // Arrange
      const service = 'account-lookup-service'
      const newImage: ImageSpec = {
        orgId: 'mojaloop',
        imageName: service,
        tag: 'v11.0.1'
      }
      const deploymentWatcher = new DeploymentWatcher(k8sApi, service, imageWatcherClient, UpgradeStrategy.BUGFIX)

      // Act
      const result = await deploymentWatcher.getPatchMessageMetadata(newImage)

      // Assert
      console.log('result is', result)
    })
  })

  describe.skip('tmp_getDesiredVersionForImageSpecs', () => {
    // Temporary test to verify that labels are working as expected
    it('gets the current image specs', async () => {
      // Arrange
      const service = 'account-lookup-service'
      const deploymentWatcher = new DeploymentWatcher(k8sApi, service, imageWatcherClient, UpgradeStrategy.BUGFIX)

      // Act
      const result = await deploymentWatcher._getCurrentImageSpecsForDeployment()

      // Assert
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
