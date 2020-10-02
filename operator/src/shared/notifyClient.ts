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
    //TODO: build the text
    const text = `\`service is not on the latest secure version. Please update urgently to latest_tag}!`
    got.post(this.webhook, {
      json: {
        text
      }
    })
  }

}