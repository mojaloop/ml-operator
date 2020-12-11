#!/usr/bin/env node

const { Octokit } = require("@octokit/rest");
const lint  = require('@commitlint/lint').default
const format = require('@commitlint/format').default
const conventional = require('@commitlint/config-conventional')
const Logger = require('@mojaloop/central-services-logger')

if (!process.env.GITHUB_TOKEN) {
  throw new Error('Github token is required')
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

if (!process.env.CIRCLE_PULL_REQUEST && !process.env.CIRCLE_PULL_REQUESTS) {
  Logger.info('No `CIRCLE_PULL_REQUEST` or `CIRCLE_PULL_REQUESTS` variable found')
  Logger.info('No PR is associated with this build. Failing silently.')
  process.exit(0)
}
const prUrl = process.env.CIRCLE_PULL_REQUEST || process.env.CIRCLE_PULL_REQUESTS
Logger.info(`prUrl is: ${prUrl}`)

async function main() {
  // e.g. https://github.com/mojaloop/ml-operator/pull/7
  const [pull_number, _, repo, owner] = prUrl.split('/').reverse().slice(0, 4)
  const result = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
  });

  const title = result.data.title
  Logger.info(`PR title is: ${title}`)
  const lintResult = await lint(title, conventional.rules)
  Logger.debug(`lintResult title is: ${lintResult}`)
  const output = format(
    {
      valid: lintResult.valid,
      errorCount: lintResult.errors.length,
      warningCount: lintResult.warnings.length,
      results: [lintResult]
    },
    {
      color: true,
    }
  );

  process.stdout.write(output);
  if (!lintResult.valid) {
    process.exit(1)
  }

  Logger.info('PR Title is valid')
}

main()
  .catch(err => {
    console.log('Error', err)
    process.exit(1)
  })
