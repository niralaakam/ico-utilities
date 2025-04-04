import { parsePng } from './png-utils'
import { splitNumberToBytes } from './bytesConverter'

const MAX_FILES = 65536
const MAX_IMAGE_DIMENSION = 256

const FILE_HEADER_SIZE = 6
const IMAGE_HEADER_SIZE = 16

export type InputImage = ArrayBuffer | Blob

interface IcoData {
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
  const buffer = await getArrayBuffer(image)

  const { width, height, bpp } = parsePng(buffer)

  if (limitImageDimension && (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION)) {
    throw new Error('INVALID_SIZE')
  }

  const imagePosition = data.imagesData.length + initialImagePosition

  const imageHeader = await getImageHeader(width, height, buffer.byteLength, imagePosition, bpp)

  const imageData = new Uint8Array(buffer)

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
