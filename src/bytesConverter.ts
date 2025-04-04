export function splitNumberToBytes(num: number, bytes: number = 2): number[] {
  if (bytes <= 1) {
    return [num & 255]
  }

  return [...splitNumberToBytes(num, bytes - 1), (num >> (8 * (bytes - 1))) & 255]
}

export function joinBytesToNumber(bytes: number[]): number {
  if (bytes.length == 1) {
    return bytes.shift() ?? 0
  }

  return ((bytes.shift() ?? 0) << (8 * bytes.length)) + joinBytesToNumber(bytes)
}
