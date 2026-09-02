import styles from 'ansi-styles'

export function bold(x: unknown): string {
  return `${styles.bold.open}${x}${styles.bold.close}`
}

export function gray(x: unknown): string {
  return `${styles.gray.open}${x}${styles.gray.close}`
}

export function cyan(x: unknown): string {
  return `${styles.cyan.open}${x}${styles.cyan.close}`
}

export function green(x: unknown): string {
  return `${styles.green.open}${x}${styles.green.close}`
}

export function yellow(x: unknown): string {
  return `${styles.yellow.open}${x}${styles.yellow.close}`
}

export function red(x: unknown): string {
  return `${styles.red.open}${x}${styles.red.close}`
}
