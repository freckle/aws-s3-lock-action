import styles from 'ansi-styles'

import {bold, cyan, gray, green, red, yellow} from './color.js'

describe('color', () => {
  test.each([
    ['bold', bold, styles.bold],
    ['gray', gray, styles.gray],
    ['cyan', cyan, styles.cyan],
    ['green', green, styles.green],
    ['yellow', yellow, styles.yellow],
    ['red', red, styles.red]
  ])('%s wraps the value in its open/close codes', (_name, f, style) => {
    expect(f('hello')).toEqual(`${style.open}hello${style.close}`)
  })

  test('stringifies non-string values', () => {
    expect(bold(42)).toEqual(`${styles.bold.open}42${styles.bold.close}`)
    expect(bold(undefined)).toEqual(`${styles.bold.open}undefined${styles.bold.close}`)
  })
})
