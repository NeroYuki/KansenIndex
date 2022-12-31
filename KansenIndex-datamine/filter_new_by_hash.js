const hashFiles = require('hash-files');
const fs = require('fs');


// options is optional
let files = fs.readdirSync('current_bo');
let hash_arr = new Map()
files.forEach((file, index) => {
    hash_arr.set(file, hashFiles.sync({files: 'current_pic/' + file}))
})

function getKey(value) {
    return [...hash_arr].find(([key, val]) => val == value)[0]
}

console.log("hash loaded")
let incoming_files = fs.readdirSync('incoming_pic');
incoming_files.forEach((file, index) => {
    let file_hash = hashFiles.sync({files: 'incoming_pic/' + file})
    if ([...(hash_arr.values())].includes(file_hash)) {
        console.log(`${file} is already in the BO as: ${getKey(file_hash)}`)
    }
    else {
        console.log(`${file} is not in the BO`)
        fs.copyFileSync('incoming_pic/' + file, 'current_pic/' + file.replace('figure_', '').replace('.png', '_1.png'))
    }
})
