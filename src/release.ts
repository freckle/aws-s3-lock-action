import * as core from "@actions/core";

import { S3Lock } from "./S3Lock";

async function run() {
  try {
    const bucket = core.getInput("bucket", { required: true });

    // If we're being called as post
    let key = core.getState("key");

    if (key === "") {
      // If we're being called directly
      key = core.getInput("key");
    }

    if (key !== "") {
      core.info(`Releasing lock at s3://${bucket}/${key}`);
      await S3Lock.releaseLock(bucket, key);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else if (typeof error === "string") {
      core.setFailed(error);
    } else {
      core.setFailed("Non-Error exception");
    }
  }
}

run();
