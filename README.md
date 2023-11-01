# AWS S3 Lock

Wait for, acquire, and release a distributed lock via S3 storage.

## Usage

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    # ...

# This blocks until the lock is acquired, or errors if timeout is reached
- uses: freckle/aws-s3-lock-action@v1
  with:
    # Required
    name: some-name
    s3-bucket: an-existing-s3-bucket

    # Optional, defaults shown
    # s3-prefix: ""
    # expires: 15m
    # timeout: {matches expires}
    # timeout-poll: 5s

- run: echo "Lock held, do work here"

```

The lock is released in our Post step, or when it expires

## Implementation & Caveats

This tool implements the locking algorithm described in this [StackOverflow
answer][answer], wrapped up with convenient actions ergonomics.

Paraphrasing the described algorithm:

- Put a lock object to S3 at `<prefix>/<name>.<uuid>`
- List all objects with prefix `<prefix>/<name>.`
- If the oldest object is ours, we've acquired the lock
- If not, we lost the race; remove our object (and try again)

[answer]: https://stackoverflow.com/questions/45222819/can-pseudo-lock-objects-be-used-in-the-amazon-s3-api/75347123#75347123

**This tool is not meant to be bullet-proof**. We built it for our needs and
accept that there are simply no strong guarantees in this locking mechanisms
operation at scale.

## Inputs and Outputs

See [action.yml](./action.yml) for a complete list of inputs and outputs.

## Versioning

Versioned tags will exist, such as `v1.0.0` and `v2.1.1`. Branches will exist
for each major version, such as `v1` or `v2` and contain the newest version in
that series.

### Release Process

Given a latest version of v1.0.1,

Is this a new major version?

If yes,

```console
git checkout main
git pull
git checkout -b v2
git tag -s -m v2.0.0 v2.0.0
git push --follow-tags
```

Otherwise,

```console
git checkout main
git pull
git checkout v1
git merge --ff-only -
git tag -s -m v1.0.2 v1.0.2    # or v1.1.0
git push --follow-tags
```

---

[LICENSE](./LICENSE)
