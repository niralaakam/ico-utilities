# ICO

A javascript library to create ICO file from PNG images.

## Installation

Install `ico-utils` using any of the command below

- `yarn add ico-utils`
- `npm install ico-utils`

## Usage

```
import { encodeIco } from 'ico-utils'

const imageOneBlob = await fetch('https://placehold.co/64/000000/FFFFFF/png?text=Image+From+Url').then(r => r.blob())

const imageTwoBuffer = await fetch('https://placehold.co/192/000000/FFFFFF/png?text=Image+From+Url').then(r => r.arrayBuffer())

const icoBlob = await encodeIco([
    imageOneBlob,
    imageTwoBuffer,
])

const icoUrl = URL.createObjectURL(icoBlob)

console.log(icoUrl)
```
