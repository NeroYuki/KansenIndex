const fs = require('fs')

let files = fs.readdirSync('input')
let count = files.length
console.log(`Found ${count} files`)

files.forEach((file, index) => {
    let a = fs.readFileSync('input/' + file)
    let b = a.slice(0xEC)
    fs.writeFileSync('output/' + file, b)
    console.log(`Progress: ${index + 1}/${count} (${((index + 1) / count) * 100}%)`)
})

