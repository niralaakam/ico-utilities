import { InputImage } from '../types.js'

export function getBlob(image: InputImage, mime = 'image/png') {
  return image instanceof Blob ? image : new Blob([image], { type: mime })
}

export async function getArrayBuffer(image: InputImage) {
  return image instanceof ArrayBuffer ? image : await image.arrayBuffer()
}
