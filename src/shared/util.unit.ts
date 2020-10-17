import { ImageSpec } from '~/domain/types'
import { imageStringToSpec } from "./util"


describe('util', () => {
  describe('imageStringToSpec', () => {
    it('parses an image correctly', () => {
      // Arrange
      const image = 'mojaloop/account-lookup-service:v10.3.0.2-pisp'
      const expected: ImageSpec = {
        orgId: 'mojaloop',
        imageName: 'account-lookup-service',
        tag: 'v10.3.0.2-pisp'
      }
      
      // Act
      const result = imageStringToSpec(image)
      
      // Assert
      expect(result).toStrictEqual(expected)
    })
  })
})