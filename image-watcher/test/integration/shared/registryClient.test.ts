import { RegistryClient, RegistryClientConfig } from "~/shared/registryClient"

describe('registryClient', () => {
  describe('getTagsForImage', () => {
    it('gets the tags for an image', async () => {
      // Arrange
      const rcConfig: RegistryClientConfig = {
        // authService: 'registry.docker.io',
        // authServiceBaseUrl: 'https://auth.docker.io',
        // registryBaseUrl: 'https://registry-1.docker.io/v2',
        cacheResults: false
      }
      const rc = new RegistryClient(rcConfig)

      // Act
      const result = await rc.getTagsForImage('mojaloop', 'central-ledger')

      // Assert
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
