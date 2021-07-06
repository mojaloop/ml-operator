import { AppsV1Api, V1DeploymentList } from '@kubernetes/client-node'
import { listDeploymentForAllNamespacesResult } from './__mock__/data'
import { IncomingMessage } from 'http';

import { ImageWatcherClient } from '../shared/imageWatcherClient'
import DeploymentWatcher from "./deploymentWatcher";

import { UpgradeStrategy } from './types'

jest.mock('../shared/imageWatcherClient')
jest.mock('../shared/notifyClient')
jest.mock('@kubernetes/client-node')

const mockImageWatcher = new ImageWatcherClient('localhost:4000')

describe('deploymentWatcher', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('constructor', () => {
    it('is well constructed', () => {
      // Arrange
      // Act
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/central-ledger', mockImageWatcher, UpgradeStrategy.BUGFIX)

      // Assert
      // test private vars
      expect(dw['k8sClient']).toBeDefined()
      expect(dw['serviceToWatch']).toBe('mojaloop/central-ledger')
      expect(dw['imageWatcherClient']).toBeDefined()
      expect(dw['strategy']).toStrictEqual(UpgradeStrategy.BUGFIX)
    })
  })

  describe('getPatchKubectlCommand', () => {
    it('gets the patch message(s) for the deployment', async () => {
      // Arrange
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/account-lookup-service', mockImageWatcher, UpgradeStrategy.BUGFIX)
      const listDeploymentsSpy = jest.spyOn(AppsV1Api.prototype, 'listDeploymentForAllNamespaces').mockResolvedValueOnce(listDeploymentForAllNamespacesResult)
      const newImage = {
        orgId: 'mojaloop',
        imageName: 'account-lookup-service',
        tag: 'v11.0.1',
      }
      const expected = [
        `kubectl patch deployment account-lookup-service --patch '{"spec": {"template": {"spec": {"containers": [{"name":"account-lookup-service","image":"mojaloop/account-lookup-service:v11.0.1"}]}}}}'`
      ]

      // Act
      const result = await dw.getPatchKubectlCommand(newImage)

      // Assert
      expect(listDeploymentsSpy).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual(expected)
    })

    it('ignores containers with mismatched names', async () => {
      // Arrange

      // Add another container to this pod
      const extraContainerResult = JSON.parse(JSON.stringify(listDeploymentForAllNamespacesResult))
      extraContainerResult.body.items[0].spec.template.spec.containers.push({ image: 'mojaloop/central-ledger:v10.3.1' })
      const listDeploymentsSpy = jest.spyOn(AppsV1Api.prototype, 'listDeploymentForAllNamespaces').mockResolvedValueOnce(extraContainerResult)

      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/account-lookup-service', mockImageWatcher, UpgradeStrategy.BUGFIX)
      const newImage = {
        orgId: 'mojaloop',
        imageName: 'account-lookup-service',
        tag: 'v11.0.1',
      }
      const expected = [
        `kubectl patch deployment account-lookup-service --patch '{"spec": {"template": {"spec": {"containers": [{"name":"account-lookup-service","image":"mojaloop/account-lookup-service:v11.0.1"}]}}}}'`
      ]

      // Act
      const result = await dw.getPatchKubectlCommand(newImage)

      // Assert
      expect(listDeploymentsSpy).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual(expected)
    })

    it('throws an error if the image tags are identical', async () => {
      // Arrange
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/account-lookup-service', mockImageWatcher, UpgradeStrategy.BUGFIX)
      const listDeploymentsSpy = jest.spyOn(AppsV1Api.prototype, 'listDeploymentForAllNamespaces').mockResolvedValueOnce(listDeploymentForAllNamespacesResult)
      const newImage = {
        orgId: 'mojaloop',
        imageName: 'account-lookup-service',
        tag: 'v10.3.1',
      }

      // Act
      const action = async () => dw.getPatchKubectlCommand(newImage)

      // Assert
      await expect(action).rejects.toThrowError('_getPatchSpecsWithMetadata, tried to generate a new patch message, but new image is not an upgrade')
      expect(listDeploymentsSpy).toHaveBeenCalledTimes(1)
    })

    it('throws an error if deployment cannot be found', async () => {
      // Arrange
      const emptyResult = JSON.parse(JSON.stringify(listDeploymentForAllNamespacesResult))
      emptyResult.body.items = []
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/account-lookup-service', mockImageWatcher, UpgradeStrategy.BUGFIX)
      const listDeploymentsSpy = jest.spyOn(AppsV1Api.prototype, 'listDeploymentForAllNamespaces').mockResolvedValueOnce(emptyResult)
      const newImage = {
        orgId: 'mojaloop',
        imageName: 'account-lookup-service',
        tag: 'v11.0.1',
      }

      // Act
      const action = async () => dw.getPatchKubectlCommand(newImage)

      // Assert
      await expect(action).rejects.toThrowError('_getDeployentListOrThrowError could not find deployment for selector: app.kubernetes.io/name == mojaloop/account-lookup-service')
      expect(listDeploymentsSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getDesiredVersionOrNull', () => {
    it('gets null', async () => {
      // Arrange
      const getCurrentImageSpecsSpy = jest.spyOn(DeploymentWatcher.prototype, '_getCurrentImageSpecsForDeployment')
      const getDesiredVersionSpy = jest.spyOn(DeploymentWatcher.prototype, '_getDesiredVersionForImageSpecs')
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/central-ledger', mockImageWatcher, UpgradeStrategy.BUGFIX)
      const originalImageSpec = {
        orgId: 'mojaloop',
        imageName: 'central-ledger',
        tag: 'v11.0.0',
      }

      getCurrentImageSpecsSpy.mockResolvedValueOnce([originalImageSpec])
      getDesiredVersionSpy.mockResolvedValueOnce(null)

      // Act
      const result = await dw.getDesiredVersionOrNull()

      // Assert
      expect(result).toBeNull()
      expect(getCurrentImageSpecsSpy).toHaveBeenCalledWith()
      expect(getDesiredVersionSpy).toHaveBeenCalledWith([originalImageSpec])
    })

    it('gets the desired version', async () => {
      // Arrange
      const getCurrentImageSpecsSpy = jest.spyOn(DeploymentWatcher.prototype, '_getCurrentImageSpecsForDeployment')
      const getDesiredVersionSpy = jest.spyOn(DeploymentWatcher.prototype, '_getDesiredVersionForImageSpecs')
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/central-ledger', mockImageWatcher, UpgradeStrategy.BUGFIX)
      const originalImageSpec = {
        orgId: 'mojaloop',
        imageName: 'central-ledger',
        tag: 'v11.0.0',
      }
      const updatedImageSpec = {
        orgId: 'mojaloop',
        imageName: 'central-ledger',
        tag: 'v11.0.1',
      }

      getCurrentImageSpecsSpy.mockResolvedValueOnce([originalImageSpec])
      getDesiredVersionSpy.mockResolvedValueOnce(updatedImageSpec)

      // Act
      const result = await dw.getDesiredVersionOrNull()

      // Assert
      expect(result).toBe(updatedImageSpec)
      expect(getCurrentImageSpecsSpy).toHaveBeenCalledWith()
      expect(getDesiredVersionSpy).toHaveBeenCalledWith([originalImageSpec])
    })

  })


  describe('_getCurrentImageSpecsForDeployment', () => {
    it('gets a list of image specs for a deployment', async () => {
      // Arrange
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/central-ledger', mockImageWatcher, UpgradeStrategy.BUGFIX)
      const listDeploymentsMockResult: { response: IncomingMessage, body: V1DeploymentList } = {
        response: null as unknown as IncomingMessage,
        body: {
          items: [
            {
              spec: {
                template: {
                  spec: {
                    containers: [
                      // @ts-ignore
                      { image: 'mojaloop/central-ledger:v11.0.0' }
                    ]
                  }
                }
              }
            }
          ]
        }
      }

      const listDeploymentsSpy = jest.spyOn(AppsV1Api.prototype, 'listDeploymentForAllNamespaces').mockResolvedValueOnce(listDeploymentsMockResult)
      const originalImageSpec = {
        orgId: 'mojaloop',
        imageName: 'central-ledger',
        tag: 'v11.0.0',
      }

      // Act
      const result = await dw._getCurrentImageSpecsForDeployment()

      // Assert
      expect(result).toStrictEqual([originalImageSpec])
      expect(listDeploymentsSpy).toHaveBeenCalledWith(false, undefined, undefined, `app.kubernetes.io/name == mojaloop/central-ledger`)
    })

    it('returns an empty list when there are no image specs found', async () => {
      // Arrange
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/central-ledger', mockImageWatcher, UpgradeStrategy.BUGFIX)
      const listDeploymentsMockResult: { response: IncomingMessage, body: V1DeploymentList } = {
        response: null as unknown as IncomingMessage,
        body: {
          // No items here
          items: []
        }
      }

      const listDeploymentsSpy = jest.spyOn(AppsV1Api.prototype, 'listDeploymentForAllNamespaces').mockResolvedValueOnce(listDeploymentsMockResult)

      // Act
      const result = await dw._getCurrentImageSpecsForDeployment()

      // Assert
      expect(result).toStrictEqual([])
      expect(listDeploymentsSpy).toHaveBeenCalledWith(false, undefined, undefined, `app.kubernetes.io/name == mojaloop/central-ledger`)
    })
  })


  describe('_getDesiredVersionForImageSpecs', () => {
    it('returns null when there are no imagespecs', async () => {
      // Arrange
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/central-ledger', mockImageWatcher, UpgradeStrategy.BUGFIX)

      // Act
      const result = await dw._getDesiredVersionForImageSpecs([])

      // Assert
      expect(result).toBeNull()
    })

    it('queries the imageWatcherClient for a desired version and returns a newer image', async () => {
      // Arrange
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/central-ledger', mockImageWatcher, UpgradeStrategy.BUGFIX)
      const originalImageSpec = {
        orgId: 'mojaloop',
        imageName: 'central-ledger',
        tag: 'v11.0.0',
      }
      const updatedImageSpec = {
        orgId: 'mojaloop',
        imageName: 'central-ledger',
        tag: 'v11.0.1',
      }
      const getLatestImageSpy = jest.spyOn(ImageWatcherClient.prototype, 'getLatestImage').mockResolvedValueOnce(updatedImageSpec)

      // Act
      const result = await dw._getDesiredVersionForImageSpecs([originalImageSpec])

      // Assert
      expect(result).toStrictEqual(updatedImageSpec)
      expect(getLatestImageSpy).toHaveBeenCalledWith(originalImageSpec, UpgradeStrategy.BUGFIX)
    })

    it('returns null if there is no newer image', async () => {
      // Arrange
      const dw = new DeploymentWatcher(new AppsV1Api(), 'mojaloop/central-ledger', mockImageWatcher, UpgradeStrategy.BUGFIX)
      const originalImageSpec = {
        orgId: 'mojaloop',
        imageName: 'central-ledger',
        tag: 'v11.0.0',
      }
      // same as above - therefore we should return null
      const updatedImageSpec = {
        orgId: 'mojaloop',
        imageName: 'central-ledger',
        tag: 'v11.0.0',
      }
      const getLatestImageSpy = jest.spyOn(ImageWatcherClient.prototype, 'getLatestImage').mockResolvedValueOnce(updatedImageSpec)

      // Act
      const result = await dw._getDesiredVersionForImageSpecs([originalImageSpec])

      // Assert
      expect(result).toBeNull()
      expect(getLatestImageSpy).toHaveBeenCalledWith(originalImageSpec, UpgradeStrategy.BUGFIX)
    })
  })
})
