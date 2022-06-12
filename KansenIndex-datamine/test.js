const pako = require('pako')
const fs = require('fs')


const compressed = new Uint8Array(fs.readFileSync('sg_image_encode.png'));
//... fill data to uncompress here
console.log(compressed.length)
const inflator = new pako.Inflate();
try {
  inflator.push(compressed)
  console.log(inflator.result)
  let out = Buffer.from(inflator.result)
  fs.writeFileSync('sg_image_decode.png', out)
} catch (err) {
  console.log(err);
}