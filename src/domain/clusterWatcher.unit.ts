import { AppsV1Api } from '@kubernetes/client-node'

import { ClusterWatcher } from "./clusterWatcher"
import { ImageWatcherClient } from '../shared/imageWatcherClient'
import { SlackNotifyClient } from '../shared/notifyClient'
import DeploymentWatcher from "./deploymentWatcher";

import { UpgradeStrategy } from './types'

jest.mock('../shared/imageWatcherClient')
jest.mock('../shared/notifyClient')
jest.mock('./deploymentWatcher')

const mockK8sApi = jest.fn() as unknown as AppsV1Api
const mockImageWatcher = new ImageWatcherClient('localhost:4000')
const mockNotifyClient = new SlackNotifyClient('localhost:4001')

describe('ClusterWatcher', () => {
  beforeEach(() => jest.resetAllMocks())

  describe('constructor', () => {
    it('is well constructed', () => {
      // Arrange
      // TODO: figure out how to mock properly
      const servicesAndStrategies = [
        { service: 'mojaloop/central-ledger', strategy: UpgradeStrategy.BUGFIX },
        { service: 'mojaloop/thirdparty-api-adapter', strategy: UpgradeStrategy.BUGFIX }
      ]

      // Act
      const clusterWatcher = new ClusterWatcher(mockK8sApi, mockImageWatcher, mockNotifyClient, servicesAndStrategies)

      // Assert
      // access private vars
      expect(clusterWatcher['k8sClient']).toBeDefined()
      expect(clusterWatcher['imageWatcherClient']).toBeDefined()
      expect(clusterWatcher['notifyClient']).toBeDefined()
      expect(clusterWatcher['servicesAndStrategies']).toStrictEqual(servicesAndStrategies)
      expect(clusterWatcher['servicesAndStrategies']).toHaveLength(servicesAndStrategies.length)
    })
  })

  describe('getLatestAndNotify', () => {
    it('checks for the latest versions and calls notifyOperator', async () => {
      // Arrange
      // TODO: figure out how to mock properly
      const servicesAndStrategies = [
        { service: 'mojaloop/central-ledger', strategy: UpgradeStrategy.BUGFIX },
        { service: 'mojaloop/thirdparty-api-adapter', strategy: UpgradeStrategy.BUGFIX }
      ]
      const clusterWatcher = new ClusterWatcher(mockK8sApi, mockImageWatcher, mockNotifyClient, servicesAndStrategies)
      const updatedImageSpec = {
        orgId: 'mojaloop',
        imageName: 'thirdparty-api-adapter',
        tag: 'v11.0.1',
      }
      jest.spyOn(DeploymentWatcher.prototype, 'getDesiredVersionOrNull').mockResolvedValueOnce(null)
      jest.spyOn(DeploymentWatcher.prototype, 'getDesiredVersionOrNull').mockResolvedValueOnce(updatedImageSpec)
      jest.spyOn(DeploymentWatcher.prototype, 'getPatchKubectlCommand').mockResolvedValueOnce(['some instructions'])

      // Act
      await clusterWatcher.getLatestAndNotify()

      // Assert
      expect(mockNotifyClient.notifyOperator).toHaveBeenCalledWith([updatedImageSpec], ['some instructions'], [])
    })

    it('fails when the DeploymentWatcher fails', async () => {
      // Arrange
      // TODO: figure out how to mock properly
      const servicesAndStrategies = [
        { service: 'mojaloop/central-ledger', strategy: UpgradeStrategy.BUGFIX },
        { service: 'mojaloop/thirdparty-api-adapter', strategy: UpgradeStrategy.BUGFIX }
      ]
      const clusterWatcher = new ClusterWatcher(mockK8sApi, mockImageWatcher, mockNotifyClient, servicesAndStrategies)
      jest.spyOn(DeploymentWatcher.prototype, 'getDesiredVersionOrNull').mockRejectedValue(new Error('test error'))

      // Act
      await clusterWatcher.getLatestAndNotify()

      // Assert
      expect(mockNotifyClient.notifyOperator).toHaveBeenCalledWith([], [], [new Error('test error'), new Error('test error')])

    })
  })
})
