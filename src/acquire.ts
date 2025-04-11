import * as core from "@actions/core";

import { S3Lock } from "./S3Lock";
import { getInputs } from "./inputs";
import { Timer } from "./timer";
import * as color from "./color";

async function run() {
  try {
    const { name, bucket, expires, timeout, timeoutPoll, context } =
      getInputs();

    const timer = new Timer(timeout);
    const s3Lock = new S3Lock(bucket, name, expires);

    while (true) {
      let result = await s3Lock.acquireLock(context);

      if (result.tag === "acquired") {
        const key = result.acquiredKey;
        const keyDetails = await s3Lock.objectKeyDetails(key);
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
      const keyDetails = await s3Lock.objectKeyDetails(key);
      const waitDuration = await s3Lock.waitDuration(key);

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
      core.info(`Waiting until lock expires (${waitDuration} from now)`);

      await timer.sleep(waitDuration);
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
