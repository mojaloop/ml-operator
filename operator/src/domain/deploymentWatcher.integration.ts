
import { AppsV1Api, KubeConfig } from "@kubernetes/client-node";
import DeploymentWatcher from './deploymentWatcher';
import { ImageWatcherClient } from '../shared/imageWatcherClient'
import { UpgradeStrategy } from './types';

jest.mock('../shared/imageWatcherClient')

const kc = new KubeConfig();
// running locally - use the ~/.kube/config file
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(AppsV1Api);
const imageWatcherClient = new ImageWatcherClient('localhost:4000')

describe('deploymentWatcher', () => {
  
  describe('_getDesiredVersionForImageSpecs', () => {
    // Temporary test to verify that labels are working as expected
    it('gets the current image specs', async () => {
      // Arrange
      const service = 'accountlookupservice'
      const deploymentWatcher = new DeploymentWatcher(k8sApi, service, imageWatcherClient, UpgradeStrategy.BUGFIX)

      // Act
      const result = await deploymentWatcher._getCurrentImageSpecsForDeployment()
      
      // Assert
      expect(result.length).toBeGreaterThan(0)
    })
  })
})