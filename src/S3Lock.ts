import * as core from "@actions/core";
import type { S3Client as S3ClientType } from "@aws-sdk/client-s3";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

import { S3LockExt, createObjectKey, validateObjectKey } from "./S3LockExt";
import { Duration } from "./duration";
import { mapMaybe } from "./maybe";
import * as color from "./color";

export type AcquireLockResult =
  | { tag: "acquired"; acquiredKey: string }
  | { tag: "not-acquired"; blockingKey: string };

export class S3Lock {
  private bucket: string;
  private prefix: string;
  private expires: Duration;
  private s3: S3ClientType;

  constructor(bucket: string, name: string, expires: Duration) {
    this.bucket = bucket;
    this.prefix = `${name}.`;
    this.expires = expires;
    this.s3 = new S3Client();
  }

  async acquireLock(body: string): Promise<AcquireLockResult> {
    const key = createObjectKey(this.prefix, this.expires);

    core.debug(`[s3] Upload ${key}`);
    const upload = new Upload({
      client: this.s3,
      params: { Bucket: this.bucket, Key: key, Body: body },
    });
    await upload.done();

    core.debug(`[s3] ListObjectsV2 ${this.prefix}`);

    const output = await this.s3.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: this.prefix,
      }),
    );

    if (output.IsTruncated) {
      throw new Error("Too many existing lock objects");
    }

    const keys = mapMaybe(output.Contents || [], (o) =>
      validateObjectKey(this.prefix, o),
    ).sort();

    core.debug(`Keys:\n- ${keys.join("\n- ")}`);

    if (keys.length === 0) {
      throw new Error("No lock objects found");
    }

    if (keys[0] === key) {
      return { tag: "acquired", acquiredKey: key };
    }

    await S3Lock.releaseLock(this.bucket, key);
    return { tag: "not-acquired", blockingKey: keys[0] };
  }

  async objectKeyDetails(key: string): Promise<string> {
    const end = key.slice(this.prefix.length);
    const { uuid, createdAt, expiresAt } = S3LockExt.fromString(end);
    const created = Duration.since(createdAt);
    const expires = Duration.until(expiresAt);

    let context;

    try {
      const obj = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      context = await obj.Body?.transformToString();
    } catch (ex) {
      core.warning(`Unable to read object body ${ex}`);
    }

    const contextLines =
      context && context === "" ? [] : [`Context: ${color.gray(context)}`];

    const messageLines = [
      `${uuid}`,
      `Created: ${color.gray(createdAt)} (${color.cyan(created)} ago)`,
      `Expires: ${color.gray(expiresAt)} (${color.cyan(expires)} from now)`,
    ].concat(contextLines);

    return messageLines.join("\n  ");
  }

  static async releaseLock(bucket: string, key: string): Promise<void> {
    const s3 = new S3Client();
    core.debug(`[s3] DeleteObject ${key}`);

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  async waitDuration(key: string): Promise<Duration> {
    const { expiresAt } = S3LockExt.fromKey(this.prefix, key);
    return Duration.until(expiresAt);
  }
}
