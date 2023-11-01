import * as core from "@actions/core";

import { S3Lock } from "./S3Lock";
import { getInputs } from "./inputs";

async function run() {
  try {
    const key = core.getState("key");

    if (key !== "") {
      const { bucket } = getInputs();
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
