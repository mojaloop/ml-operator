# ml-operator


## Running Locally

```bash
# Start the image-watcher service
cd ../image-watcher
docker-compose up -d redis
npm run start

export SLACK_WEBHOOK_URL=<insert_webhook_url>
npm run start
```