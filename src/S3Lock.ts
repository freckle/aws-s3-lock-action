// https://stackoverflow.com/questions/45222819/can-pseudo-lock-objects-be-used-in-the-amazon-s3-api/75347123#75347123

import * as S3 from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import { Duration } from "./duration";
import { compareObjects } from "./sort-objects";
import { normalizePrefix } from "./normalize-prefix";

export type AcquireLockResult = "acquired" | "not-acquired";

export class S3Lock {
  bucket: string;
  prefix: string;
  name: string;
  uuid: string;
  expires: Duration;

  private key: string;
  private keyPrefix: string;
  private s3: S3.S3Client;

  constructor(
    bucket: string,
    prefix: string,
    name: string,
    expires: Duration,
    uuid?: string,
  ) {
    this.bucket = bucket;
    this.prefix = normalizePrefix(prefix);
    this.name = name;
    this.uuid = uuid ? uuid : uuidv4();
    this.expires = expires;

    this.keyPrefix = `${this.prefix}${this.name}.`;
    this.key = `${this.keyPrefix}${this.uuid}`;
    this.s3 = new S3.S3Client();
  }

  async acquireLock(): Promise<AcquireLockResult> {
    await this.createLock();

    const output = await this.listLocks();
    const oldestKey = this.getOldestKey(output);

    if (oldestKey === this.key) {
      return "acquired";
    }

    await this.releaseLock();
    return "not-acquired";
  }

  async releaseLock(): Promise<void> {
    await this.s3.send(
      new S3.DeleteObjectCommand({
        Bucket: this.bucket,
        Key: this.key,
      }),
    );
  }

  private async createLock(): Promise<void> {
    await this.s3.send(
      new S3.PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key,
        Expires: this.expires.after(new Date()),
      }),
    );
  }

  private async listLocks(): Promise<S3.ListObjectsV2Output> {
    return await this.s3.send(
      new S3.ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: this.keyPrefix,
      }),
    );
  }

  private getOldestKey(output: S3.ListObjectsV2Output): string {
    if (output.IsTruncated) {
      // If we've got > ~1,000 locks here, something is very wrong
      throw new Error("Too many lock objects present");
    }

    const contents = output.Contents ?? [];

    if (contents.length === 0) {
      // If our own lock didn't get written/returned, something is very wrong
      throw new Error("No lock objects found");
    }

    const sorted = contents.sort(compareObjects);
    const sortedKey = sorted[0].Key;

    if (!sortedKey) {
      // If the thing doesn't have a Key, something is very wrong
      throw new Error("Oldest object has no Key");
    }

    return sortedKey;
  }
}
