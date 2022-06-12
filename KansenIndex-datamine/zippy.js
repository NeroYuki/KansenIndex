const fs = require('fs')
const unzipper = require('unzipper')
const { Readable } = require('stream');

function zip_decompress(data) {
    return new Promise((resolve, reject) => {

        const stream = new Readable();
        stream._read = () => {}
        stream.push(data)
        stream.push(null)
        stream.pipe((unzipper.Parse())
            .on('entry', async function (entry) {
                const fileName = entry.path;
                const type = entry.type;
                const size = entry.vars.uncompressedSize; 
                //if entry names is 'data', it contains all the stuff we need, load the decompressed data, resolve it and GTFO!
                console.log(fileName, type, size)
                console.log(entry)
                if (!fs.existsSync('output_struct/' + fileName.slice(0, fileName.lastIndexOf('/')))) {
                    fs.mkdirSync('output_struct/' + fileName.slice(0, fileName.lastIndexOf('/')), {recursive: true})
                }
                entry.pipe(fs.createWriteStream('output_struct/' + fileName));
                entry.autodrain().on('error', e => {console.log(e);})
                resolve([fileName])
            })
            //should throw everytime due to unexpected EoF (Cant find central directory), but if data is resolved before reaching it we are ok
            //should throw if there is another error anyway (after 2 seconds to prevent the function from stucking only)
            .on('error', e => { 
                //console.log(e)
                setTimeout(() => reject(), 2000)
            }))

    }).catch()
}

// async function not_zip_decompress(data) {
//     let buf = Buffer.from(data)
//     let version = buf.re
// } 

async function main() {

    let content = Buffer.from(fs.readFileSync('output/resources'))
    let offset = 8
    let end_offset = 8
    let file_count = 0
    let new_content = Buffer.from([])

    while (end_offset > 0 && offset < content.length) {   
        //console.log(offset, end_offset)
        end_offset = content.indexOf("PK\x03\x04\x14\x00\x00\x08\x08\x00", offset + 8) - 8
        //console.log(end_offset)
        if (end_offset > 0)
            new_content = content.slice(offset, end_offset)
        else 
            new_content = content.slice(offset)
        let length = new_content.length

        //console.log(end_offset - offset)

        if (file_count < 10) {
            console.log(`file${file_count}.zip, size: ${length}`)

            console.log(await zip_decompress(new_content).catch(err => {}))
            //console.log(file_name)
        }

        file_count += 1
        offset = end_offset.valueOf() + 8
    }
}

main()


// fs.writeFileSync(`output/file${file_count}.zip`, new_content)