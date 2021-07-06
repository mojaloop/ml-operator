#!/usr/bin/env bash

# run a release for either `master` or `next` branch

set -e
set -u

RELEASE_COMMIT_MESSAGE_FORMAT='chore(release): {{currentTag}} [skip ci]'

echo "RELEASE_COMMIT_MESSAGE_FORMAT is: ${RELEASE_COMMIT_MESSAGE_FORMAT}"


case ${CIRCLE_BRANCH} in
  # mainline release
  master)
    ./node_modules/.bin/standard-version \
      --releaseCommitMessageFormat "${RELEASE_COMMIT_MESSAGE_FORMAT}"
  ;;

  # prerelease
  next)
      ./node_modules/.bin/standard-version \
        --prerelease alpha \
        --releaseCommitMessageFormat "${RELEASE_COMMIT_MESSAGE_FORMAT}"
  ;;

  *)
    echo "tried to run a release for unknown branch: ${CIRCLE_BRANCH}"
    exit 1
  ;;

esac

# Push the tag so circleci will build the artifacts
git push --follow-tags origin ${CIRCLE_BRANCH}