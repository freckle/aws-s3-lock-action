import * as core from '@actions/core'

import {Duration} from './duration.js'
import {S3Lock} from './S3Lock.js'
import {S3LockExt} from './S3LockExt.js'

type Command = {type: string; input: {Bucket?: string; Key?: string}}

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  uploadDone: vi.fn(),
  uploaded: [] as {Bucket: string; Key: string; Body: string}[]
}))

// The SDK's commands and clients are all constructed with `new`, so each stub
// has to be a class rather than an arrow function
vi.mock('@aws-sdk/client-s3', () => {
  const command = (type: string) =>
    class {
      type = type
      input: unknown
      constructor(input: unknown) {
        this.input = input
      }
    }

  return {
    S3Client: class {
      send = mocks.send
    },
    ListObjectsV2Command: command('list'),
    DeleteObjectCommand: command('delete'),
    GetObjectCommand: command('get')
  }
})

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: class {
    done = mocks.uploadDone
    constructor({params}: {params: {Bucket: string; Key: string; Body: string}}) {
      mocks.uploaded.push(params)
    }
  }
}))

vi.mock('@actions/core', () => ({debug: vi.fn(), warning: vi.fn()}))

const bucket = 'my-bucket'
const name = 'my-workflow/my-job'
const prefix = `${name}.`
const expires = new Duration('15m')

// Our own key is generated internally; the Upload params are how we learn it
const ownKey = (): string => mocks.uploaded[0].Key

const sentCommands = (type: string): Command[] =>
  mocks.send.mock.calls.map(([cmd]) => cmd as Command).filter(cmd => cmd.type === type)

const keyWith = (created: Date, uuid: string, expiresAt: Date): string => {
  const ext = new S3LockExt(expires)
  ext.createdAt = created
  ext.expiresAt = expiresAt
  ext.uuid = uuid
  return `${prefix}${ext}`
}

describe(S3Lock.name, () => {
  beforeEach(() => {
    mocks.uploaded.length = 0
    mocks.uploadDone.mockResolvedValue({})
  })

  describe('acquireLock', () => {
    test('uploads a lock object under the given name', async () => {
      mocks.send.mockImplementation(() => Promise.resolve({Contents: [{Key: ownKey()}]}))

      await new S3Lock(bucket, name, expires).acquireLock('some context')

      expect(mocks.uploaded).toHaveLength(1)
      expect(mocks.uploaded[0].Bucket).toEqual(bucket)
      expect(mocks.uploaded[0].Body).toEqual('some context')
      expect(mocks.uploaded[0].Key).toMatch(/^my-workflow\/my-job\.[0-9]+\.[a-f0-9-]+\.[0-9]+$/)
      expect(mocks.uploadDone).toHaveBeenCalled()
    })

    test('acquires the lock when our key sorts first', async () => {
      mocks.send.mockImplementation(() => Promise.resolve({Contents: [{Key: ownKey()}]}))

      const result = await new S3Lock(bucket, name, expires).acquireLock('ctx')

      expect(result).toEqual({tag: 'acquired', acquiredKey: ownKey()})
      expect(sentCommands('delete')).toHaveLength(0)
    })

    test('does not acquire, and removes our key, when an older key is present', async () => {
      const older = keyWith(
        new Duration('1h').before(new Date()),
        'older-uuid',
        new Duration('1h').after(new Date())
      )

      mocks.send.mockImplementation(() =>
        Promise.resolve({Contents: [{Key: older}, {Key: ownKey()}]})
      )

      const lock = new S3Lock(bucket, name, expires)
      const ours = await lock.acquireLock('ctx').then(r => ({r, key: ownKey()}))

      expect(ours.r).toEqual({tag: 'not-acquired', blockingKey: older})

      const deletes = sentCommands('delete')
      expect(deletes).toHaveLength(1)
      expect(deletes[0].input).toEqual({Bucket: bucket, Key: ours.key})
    })

    test('lists objects scoped to the lock prefix', async () => {
      mocks.send.mockImplementation(() => Promise.resolve({Contents: [{Key: ownKey()}]}))

      await new S3Lock(bucket, name, expires).acquireLock('ctx')

      const lists = sentCommands('list')
      expect(lists).toHaveLength(1)
      expect(lists[0].input).toEqual({Bucket: bucket, Prefix: prefix})
    })

    test('fails when the object listing is truncated', async () => {
      mocks.send.mockResolvedValue({IsTruncated: true})

      await expect(new S3Lock(bucket, name, expires).acquireLock('ctx')).rejects.toThrow(
        'Too many existing lock objects'
      )
    })

    test('fails when the listing comes back empty', async () => {
      mocks.send.mockResolvedValue({Contents: []})

      await expect(new S3Lock(bucket, name, expires).acquireLock('ctx')).rejects.toThrow(
        'No lock objects found'
      )
    })

    test('fails when every listed key has already expired', async () => {
      const expired = keyWith(
        new Duration('2h').before(new Date()),
        'expired-uuid',
        new Duration('1h').before(new Date())
      )

      mocks.send.mockResolvedValue({Contents: [{Key: expired}]})

      await expect(new S3Lock(bucket, name, expires).acquireLock('ctx')).rejects.toThrow(
        'No lock objects found'
      )
    })
  })

  describe('objectKeyDetails', () => {
    test('describes the uuid, timestamps and body', async () => {
      const key = keyWith(new Date(), 'some-uuid', new Duration('15m').after(new Date()))

      mocks.send.mockResolvedValue({
        Body: {transformToString: () => Promise.resolve('workflow #12')}
      })

      const details = await new S3Lock(bucket, name, expires).objectKeyDetails(key)

      expect(details).toContain('some-uuid')
      expect(details).toContain('Created:')
      expect(details).toContain('Expires:')
      expect(details).toContain('workflow #12')
    })

    test('reads the body with a key scoped to the bucket', async () => {
      const key = keyWith(new Date(), 'some-uuid', new Duration('15m').after(new Date()))

      mocks.send.mockResolvedValue({
        Body: {transformToString: () => Promise.resolve('ctx')}
      })

      await new S3Lock(bucket, name, expires).objectKeyDetails(key)

      expect(sentCommands('get')[0].input).toEqual({Bucket: bucket, Key: key})
    })

    test('warns but still describes the lock when the body cannot be read', async () => {
      const key = keyWith(new Date(), 'some-uuid', new Duration('15m').after(new Date()))

      mocks.send.mockRejectedValue(new Error('access denied'))

      const details = await new S3Lock(bucket, name, expires).objectKeyDetails(key)

      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining('Unable to read object body')
      )
      expect(details).toContain('some-uuid')
    })

    test('rejects a key whose extension is malformed', async () => {
      await expect(
        new S3Lock(bucket, name, expires).objectKeyDetails(`${prefix}not-a-lock`)
      ).rejects.toThrow(/3 dot-separated parts/)
    })
  })

  describe('releaseLock', () => {
    test('deletes the object at the given key', async () => {
      mocks.send.mockResolvedValue({})

      await S3Lock.releaseLock(bucket, 'some/key')

      const deletes = sentCommands('delete')
      expect(deletes).toHaveLength(1)
      expect(deletes[0].input).toEqual({Bucket: bucket, Key: 'some/key'})
    })
  })
})
