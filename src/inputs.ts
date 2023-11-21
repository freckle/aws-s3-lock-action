import * as core from "@actions/core";

import { Duration } from "./duration";

export type Inputs = {
  bucket: string;
  name: string;
  expires: Duration;
  timeout: Duration;
  timeoutPoll: Duration;
  context: string;
};

export function getInputs(): Inputs {
  // Required
  const bucket = core.getInput("bucket", { required: true });
  const name = core.getInput("name", { required: true });

  // Optional or defaulted
  const rawExpires = core.getInput("expires", { required: true });
  const rawTimeout = core.getInput("timeout", { required: false });
  const rawTimeoutPoll = core.getInput("timeout-poll", { required: true });
  const context = core.getInput("context", { required: false });

  const expires = Duration.parse(rawExpires);
  const timeout = rawTimeout === "" ? expires : Duration.parse(rawTimeout);
  const timeoutPoll = Duration.parse(rawTimeoutPoll);

  return { name, bucket, expires, timeout, timeoutPoll, context };
}
