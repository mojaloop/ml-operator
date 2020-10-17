import Logger from '@mojaloop/central-services-logger';
import got from 'got'
import { ImageSpec } from '../domain/types';

export interface NotifyClient {
  notifyOperator(services: Array<ImageSpec>, commands?: Array<string>, failures?: Array<Error>): Promise<void>
}

export class SlackNotifyClient implements NotifyClient {
  private webhook: string;

  constructor(webhook: string) {
    this.webhook = webhook
  }

  public async notifyOperator(services: Array<ImageSpec>, commands?: Array<string>, failures?: Array<Error>): Promise<void> {
    Logger.info('SlackNotifyClient.notifyOperator - sending slack notification')
    let textLines = [ '*ml-operator* - all monitored services are up to date']
    if (services.length > 0) {
      // TODO: convert these into a copy/pastable helm script
      textLines = ['*ml-operator* - The following services are not on the latest secure version and should be updated:']
      services.forEach(service => {
        textLines.push(`  - \`${service.orgId}/${service.imageName}\`: latest version is \`${service.tag}\``)
      })

      if (commands && commands.length > 0) {
        textLines.push('Use the following commands to patch your deployments with `kubectl`:\n```')
        commands.forEach(command => textLines.push(command))
        textLines.push('```')
      }
    }

    if (failures && failures.length) {
      textLines.push(`**warning:** encountered ${failures.length} processing errors. Please check your logs for more information.`)
    }

    const text = textLines.join('\n')

    Logger.debug(`SlackNotifyClient.notifyOperator - sending message: \n    ${text}`)
    got.post(this.webhook, { json: { text } })
  }

}
