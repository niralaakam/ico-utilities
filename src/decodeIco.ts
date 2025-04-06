import { parsePng } from './png-utils.js'
import { getBlob, getArrayBuffer } from './helpers/binaryConverter.js'
import { joinBytesToNumber } from './helpers/bytesConverter.js'
import { InputImage } from './types.js'

const FILE_HEADER_SIZE = 6
const IMAGE_HEADER_SIZE = 16

export async function decodeIco(icoImage: InputImage) {
  const buffer = await getArrayBuffer(icoImage)

  const uint8 = new Uint8Array(buffer)

  if (!isIcoSignatureValid(uint8.slice(0, 4))) {
    throw new Error('INVALID_ICO_IMAGE')
  }

  const imagesCount = joinBytesToNumber(Array.from(uint8.slice(4, 6)))

  const initialImagePosition = FILE_HEADER_SIZE + IMAGE_HEADER_SIZE * imagesCount

  const imagesHeader = Array.from(uint8.slice(FILE_HEADER_SIZE, initialImagePosition))

  const imagesDetails = getImagesDetails(imagesHeader)

  const images = imagesDetails.map((imageDetails) => {
    const imageUint8 = uint8.slice(imageDetails.position, imageDetails.position + imageDetails.size)

    return {
      ...parsePng(imageUint8),
      blob: getBlob(imageUint8),
    }
  })

  return images
}

function getImagesDetails(imagesHeader: number[]): { position: number; size: number }[] {
  if (imagesHeader.length < 1) {
    return []
  }

  const imageHeader = imagesHeader.splice(0, IMAGE_HEADER_SIZE)

  const position = joinBytesToNumber(imageHeader.slice(12, 16))

  const size = joinBytesToNumber(imageHeader.slice(8, 12))

  return [{ position, size }, ...getImagesDetails(imagesHeader)]
}

function isIcoSignatureValid(imageSignatureBytes: Uint8Array<ArrayBuffer>) {
  const icoSignatureBytes = [0x00, 0x00, 0x01, 0x00]

  return icoSignatureBytes.toString() === imageSignatureBytes.toString()
}
