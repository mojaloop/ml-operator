import Logger from '@mojaloop/central-services-logger';
import got from 'got'
import { ImageSpec } from '../domain/types';

export interface NotifyClient {
  notifyOperator(services: Array<ImageSpec>): Promise<void>
}

export class SlackNotifyClient implements NotifyClient {
  private webhook: string;

  constructor(webhook: string) {
    this.webhook = webhook
  }

  public async notifyOperator(services: Array<ImageSpec>): Promise<void> {
    Logger.info('SlackNotifyClient.notifyOperator - sending slack notification')
    let textLines = [ '*ml-operator* - all monitored services are up to date']
    if (services.length > 0) {      
      // TODO: convert these into a copy/pastable helm script
      textLines = ['*ml-operator* - The following services are not on the latest secure version and should be updated:']
      services.forEach(service => {
        textLines.push(`  - \`${service.orgId}/${service.imageName}\`: latest version is \`${service.tag}\``)
      })
    }

    const text = textLines.join('\n')
    got.post(this.webhook, { json: { text } })
  }

}