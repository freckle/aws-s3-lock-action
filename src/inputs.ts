import * as core from "@actions/core";

import { Duration } from "./duration";

export type Inputs = {
  name: string;
  s3Bucket: string;
  s3Prefix: string;
  expires: Duration;
  timeout: Duration;
  timeoutPoll: Duration;
};

export function getInputs(): Inputs {
  const name = core.getInput("name", { required: true });
  const s3Bucket = core.getInput("s3-bucket", { required: true });
  const s3Prefix = core.getInput("s3-prefix", { required: false });

  const rawExpires = core.getInput("expires", { required: true });
  const expires = Duration.parse(rawExpires);

  const rawTimeout = core.getInput("timeout", { required: false });
  const timeout = rawTimeout === "" ? expires : Duration.parse(rawTimeout);

  const rawTimeoutPoll = core.getInput("timeout", { required: true });
  const timeoutPoll = Duration.parse(rawTimeoutPoll);

  return { name, s3Bucket, s3Prefix, expires, timeout, timeoutPoll };
}
