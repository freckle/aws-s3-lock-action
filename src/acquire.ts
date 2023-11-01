import * as core from "@actions/core";

import { S3Lock } from "./S3Lock";
import { getInputs } from "./inputs";
import { Timer } from "./timer";

async function run() {
  try {
    const { name, s3Bucket, s3Prefix, expires, timeout, timeoutPoll } =
      getInputs();

    const timer = new Timer(timeout);
    const s3Lock = new S3Lock(s3Bucket, s3Prefix, name, expires);

    // Used to instantiate the same S3Lock for release
    core.saveState("uuid", s3Lock.uuid);

    while (true) {
      let result = await s3Lock.acquireLock();

      if (result === "acquired") {
        break;
      }

      if (timer.expired()) {
        throw new Error("Lock was not acquired within timeout");
      }

      await timer.sleep(timeoutPoll);
    }

    core.setOutput("acquired-at", new Date());
    core.info("Lock acquired");
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
