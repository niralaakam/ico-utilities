const MAX_FILES = 65536
const MAX_IMAGE_DIMENSION = 256

const FILE_HEADER_SIZE = 6
const IMAGE_HEADER_SIZE = 16

export type InputImage = ArrayBuffer | Blob

export interface Dimensions {
  width: number
  height: number
}

export interface IcoData {
  imagesHeader: number[]
  imagesData: number[]
}

export async function encodeIco(
  inputs: InputImage[],
  limitImageDimension = true,
  mime = 'image/x-icon',
) {
  if (inputs.length > MAX_FILES) {
    throw new Error('TOO_MANY_FILES')
  }

  const icoFileHeader = [0, 0, 1, 0, ...splitNumberToBytes(inputs.length)]

  const initialImagePosition = FILE_HEADER_SIZE + IMAGE_HEADER_SIZE * inputs.length

  const { imagesHeader, imagesData } = await inputs.reduce(
    async (data: Promise<IcoData>, input: InputImage) => {
      return processInput(await data, input, initialImagePosition, limitImageDimension)
    },
    Promise.resolve({ imagesHeader: [], imagesData: [] }),
  )

  const ico = new Uint8Array([...icoFileHeader, ...imagesHeader, ...imagesData])

  return getBlob(ico, mime)
}

async function processInput(
  data: IcoData,
  image: InputImage,
  initialImagePosition: number,
  limitImageDimension: boolean,
) {
  const blob = getBlob(image)

  const { width, height } = await getImageDimensions(blob)

  if (limitImageDimension && (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION)) {
    throw new Error('INVALID_SIZE')
  }

  const imagePosition = data.imagesData.length + initialImagePosition

  const imageHeader = await getImageHeader(width, height, blob.size, imagePosition)

  const imageData = new Uint8Array(await getArrayBuffer(image))

  return {
    imagesHeader: [...data.imagesHeader, ...imageHeader],
    imagesData: [...data.imagesData, ...imageData],
  }
}

async function getImageHeader(
  width: number,
  height: number,
  size: number,
  imagePosition: number,
  bpp?: number | null,
) {
  const widthBytes = width >= MAX_IMAGE_DIMENSION ? 0 : width // 0 for 256px
  const heightBytes = height >= MAX_IMAGE_DIMENSION ? 0 : height // 0 for 256px
  const numOfColoursInPalette = 0 // 0 means 2^n colors
  const reservedByte = 0 // must set to 0
  const colourPlaneBytes = [1, 0] // must set to 1

  return [
    widthBytes,
    heightBytes,
    numOfColoursInPalette,
    reservedByte,
    ...colourPlaneBytes,
    ...(bpp ? splitNumberToBytes(bpp) : [0, 0]), // number of bits per pixel; common values are 1, 4, 8, or 32
    ...splitNumberToBytes(size, 4),
    ...splitNumberToBytes(imagePosition, 4),
  ]
}

function getBlob(image: InputImage, mime = 'image/png') {
  return image instanceof Blob ? image : new Blob([image], { type: mime })
}

async function getArrayBuffer(image: InputImage) {
  return image instanceof ArrayBuffer ? image : await image.arrayBuffer()
}

const CHANNELS_PER_PIXEL: { [index: number]: number } = {
  0: 1,
  2: 3,
  3: 1,
  4: 2,
  6: 4,
}

function parsePng(buffer: ArrayBuffer) {
  const uint8 = new Uint8Array(buffer.slice(0, 33))

  if (!isPngSignatureValid(uint8.slice(0, 8))) {
    throw new Error('INVALID_IMAGE')
  }

  if (!isIhdrChunkValid(uint8.slice(8, 16))) {
    throw new Error('INVALID_IMAGE')
  }

  const width = joinBytesToNumber(Array.from(uint8.slice(16, 20)))

  const height = joinBytesToNumber(Array.from(uint8.slice(20, 24)))

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

function getImageDimensions(image: Blob) {
  return new Promise<Dimensions>((resolve, reject) => {
    const img = new Image()

    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })

    img.onerror = () => reject('INVALID_IMAGE')

    img.src = URL.createObjectURL(image)
  })
}

function splitNumberToBytes(num: number, bytes: number = 2): number[] {
  if (bytes <= 1) {
    return [num & 255]
  }

  return [...splitNumberToBytes(num, bytes - 1), (num >> (8 * (bytes - 1))) & 255]
}

function joinBytesToNumber(bytes: number[]): number {
  if (bytes.length == 1) {
    return bytes.shift() ?? 0
  }

  return ((bytes.shift() ?? 0) << (8 * bytes.length)) + joinBytesToNumber(bytes)
}
