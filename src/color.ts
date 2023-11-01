import styles from "ansi-styles";

export function bold(x: any): string {
  return `${styles.bold.open}${x}${styles.bold.close}`;
}

export function gray(x: any): string {
  return `${styles.gray.open}${x}${styles.gray.close}`;
}

export function cyan(x: any): string {
  return `${styles.cyan.open}${x}${styles.cyan.close}`;
}

export function green(x: any): string {
  return `${styles.green.open}${x}${styles.green.close}`;
}

export function yellow(x: any): string {
  return `${styles.yellow.open}${x}${styles.yellow.close}`;
}

export function red(x: any): string {
  return `${styles.red.open}${x}${styles.red.close}`;
}
