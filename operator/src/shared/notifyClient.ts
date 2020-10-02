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

  public async notifyOperator(_services: Array<ImageSpec>): Promise<void> {
    if (_services.length < 1) {
      Logger.warn('SlackNotifyClient.notifyOperator - no images to notify. Skipping sending notification.')
      return;
    }

    //TODO: build the text
    const text = `\`service is not on the latest secure version. Please update urgently to latest_tag}!`
    got.post(this.webhook, {
      json: {
        text
      }
    })
  }

}