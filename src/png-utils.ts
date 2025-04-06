import { joinBytesToNumber } from './helpers/bytesConverter.js'

const CHANNELS_PER_PIXEL: { [index: number]: number } = {
  0: 1,
  2: 3,
  3: 1,
  4: 2,
  6: 4,
}

export function parsePng(buffer: ArrayBuffer) {
  const uint8 = new Uint8Array(buffer.slice(0, 33))

  if (!isPngSignatureValid(uint8.slice(0, 8))) {
    throw new Error('INVALID_PNG_IMAGE')
  }

  if (!isIhdrChunkValid(uint8.slice(8, 16))) {
    throw new Error('INVALID_PNG_IMAGE')
  }

  const width = joinBytesToNumber(Array.from(uint8.slice(16, 20).reverse()))

  const height = joinBytesToNumber(Array.from(uint8.slice(20, 24).reverse()))

  const bitsPerChannel = uint8[24]

  const colourType = uint8[25]

  const bitsPerPixel = bitsPerChannel * CHANNELS_PER_PIXEL[colourType]

  return { width, height, bpp: bitsPerPixel }
}

function isPngSignatureValid(imageSignatureBytes: Uint8Array<ArrayBuffer>) {
  const pngSignatureBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

  return pngSignatureBytes.toString() === imageSignatureBytes.toString()
}

function isIhdrChunkValid(chunkBeginBytes: Uint8Array<ArrayBuffer>) {
  const ihdrChunkBeginBytes = [0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]

  return ihdrChunkBeginBytes.toString() === chunkBeginBytes.toString()
}
