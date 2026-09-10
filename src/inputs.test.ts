import * as core from '@actions/core'

import {getInputs} from './inputs.js'

vi.mock('@actions/core', () => ({getInput: vi.fn()}))

const withInputs = (values: Record<string, string>) => {
  vi.mocked(core.getInput).mockImplementation((name: string) => values[name] ?? '')
}

describe(getInputs.name, () => {
  test('reads and parses every input', () => {
    withInputs({
      bucket: 'my-bucket',
      name: 'my-workflow/my-job',
      expires: '15m',
      timeout: '5m',
      'timeout-poll': '5s',
      context: 'my-workflow #1'
    })

    const inputs = getInputs()

    expect(inputs.bucket).toEqual('my-bucket')
    expect(inputs.name).toEqual('my-workflow/my-job')
    expect(inputs.expires.milliseconds()).toEqual(900_000)
    expect(inputs.timeout.milliseconds()).toEqual(300_000)
    expect(inputs.timeoutPoll.milliseconds()).toEqual(5_000)
    expect(inputs.context).toEqual('my-workflow #1')
  })

  test('defaults timeout to expires when it is not given', () => {
    withInputs({
      bucket: 'my-bucket',
      name: 'my-lock',
      expires: '15m',
      'timeout-poll': '5s'
    })

    const inputs = getInputs()

    expect(inputs.timeout.milliseconds()).toEqual(inputs.expires.milliseconds())
    expect(inputs.timeout.milliseconds()).toEqual(900_000)
  })

  test('allows an empty context', () => {
    withInputs({
      bucket: 'my-bucket',
      name: 'my-lock',
      expires: '15m',
      'timeout-poll': '5s'
    })

    expect(getInputs().context).toEqual('')
  })

  test('propagates an unparseable duration', () => {
    withInputs({
      bucket: 'my-bucket',
      name: 'my-lock',
      expires: 'nonsense',
      'timeout-poll': '5s'
    })

    expect(() => getInputs()).toThrow(/invalid duration/)
  })
})
