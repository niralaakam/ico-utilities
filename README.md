# ICO

A javascript library to create ICO file from PNG images.

## Installation

Install `ico-utils` using any of the command below

- `yarn add ico-utils`
- `npm install ico-utils`

## Usage

To create ICO file using PNG images:

```
import { encodeIco } from 'ico-utils'

const imageOneBlob = await fetch(
  'https://placehold.co/64/000000/FFFFFF/png?text=Image+From+Url',
).then((response) => response.blob())

const imageTwoBuffer = await fetch(
  'https://placehold.co/192/000000/FFFFFF/png?text=Image+From+Url',
).then((response) => response.arrayBuffer())

const icoBlob = await encodeIco([imageOneBlob, imageTwoBuffer])

const icoUrl = URL.createObjectURL(icoBlob)

console.log(icoUrl)
```

To extract PNG images from an ICO file:

```
import { decodeIco } from 'ico-utils'

const icoImage = getIcoImage() // Ico file as ArrayBuffer or Blob

const pngImages = await decodeIco(icoImage)

console.log(pngImages)
```

The above code will log the details into console as follows:

```
[
    {
        "width": 16,
        "height": 16,
        "bpp": 32,
        "blob": Blob {size: 688, type: 'image/png'}
    },
    {
        "width": 32,
        "height": 32,
        "bpp": 32,
        "blob": Blob {size: 1386, type: 'image/png'}
    }
]
```
