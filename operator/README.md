# ml-operator


## Running Locally

```bash
# Start the image-watcher service
cd ../image-watcher
docker-compose up -d redis
npm run start

export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/****/***
npm run start
```