const lzo = require('lzo');
const fs = require('fs')
 
// let str = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam'
// compressed = lzo.compress(str);

let files = fs.readdirSync('input')
let count = files.length
console.log(`Found ${count} files`)

files.forEach((file, index) => {
    let a = fs.readFileSync('input/' + file)
    let decompressed = lzo.decompress(a.slice(0x8E));

    fs.writeFileSync('output/' + file, decompressed)
    console.log(`Progress: ${index + 1}/${count} (${((index + 1) / count) * 100}%)`)
})



//console.log(string)