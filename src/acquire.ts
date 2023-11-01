import * as core from "@actions/core";

import { S3Lock } from "./S3Lock";
import { getInputs } from "./inputs";
import { Timer } from "./timer";
import * as color from "./color";

async function run() {
  try {
    const { name, bucket, expires, timeout, timeoutPoll } = getInputs();

    const timer = new Timer(timeout);
    const s3Lock = new S3Lock(bucket, name, expires);

    while (true) {
      let result = await s3Lock.acquireLock();

      if (result.tag === "acquired") {
        const key = result.acquiredKey;
        const keyDetails = s3Lock.objectKeyDetails(key);
        core.info(
          `Lock ${color.bold(name)} ${color.green(
            "acquired",
          )} at ${keyDetails}`,
        );
        core.setOutput("acquired-at", new Date());
        core.setOutput("key", key);
        core.saveState("key", key);
        break;
      }

      const key = result.blockingKey;
      const keyDetails = s3Lock.objectKeyDetails(key);

      if (timer.expired()) {
        core.error(
          `Lock ${color.bold(name)} ${color.red(
            "already held",
          )} by ${keyDetails}`,
        );
        throw new Error("Lock was not acquired within timeout");
      }

      core.info(
        `Lock ${color.bold(name)} ${color.yellow(
          "already held",
        )} by ${keyDetails}`,
      );
      core.info(`Waiting ${timeoutPoll}`);

      await timer.sleep(timeoutPoll);
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
