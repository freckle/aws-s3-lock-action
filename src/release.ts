import * as core from "@actions/core";

import { S3Lock } from "./S3Lock";
import { getInputs } from "./inputs";

async function run() {
  try {
    const { name, s3Bucket, s3Prefix, expires } = getInputs();
    const uuid = core.getState("uuid");
    const s3Lock = new S3Lock(s3Bucket, s3Prefix, name, expires, uuid);
    await s3Lock.releaseLock();
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
