// // only support byte-to-byte
// function xor_decrypt(input, key) {
    
// }
const fs = require('fs')

function decrypt(file_in, file_out) {
    let content = ""
    try {
        content = Buffer.from(fs.readFileSync(file_in))
    }
    catch (e) {
        console.log(e)
        return
    }
    offset = 7
    key = content[6]
    let res = []
    while (offset < content.length) {
        res.push(content[offset] ^ key)
        offset++
    }
    let buf_res = Buffer.from(res)

    //console.log("decode", buf_res.toString('utf-8'))

    const dir_out = file_out.replace(/(\/)(?!.*\/).*$/, "")
    //console.log(dir_out)
    if (!fs.existsSync(dir_out)){
        fs.mkdirSync(dir_out, { recursive: true });
    }
    fs.writeFileSync(file_out, buf_res)
    console.log('decoded', file_in, '->', file_out)
}

function main() {
    // let lines = fs.readFileSync('resData.txt', {encoding: 'utf-8'}).split('\n')
    // let obj_list = []
    // lines.forEach((line) => {
    //     let comp = line.split('\t')
    //     obj_list.push({out: comp[0], in: comp[1]})
    // })
    // //console.log(obj_list)
    // delete lines
    // const len = obj_list.length
    // obj_list.forEach((entry, index) => {
    //     if (index < 18988) return
    //     decrypt('./encoded_input/' + entry.in, './decoded_output/' + entry.out)
    //     console.log(index, "/" , len, `(${index / len * 100})`)
    // })
    let files = fs.readdirSync('./encoded_input')
    const len = files.length
    files.forEach((entry, index) => {
        //if (index < 18988) return
        decrypt('./encoded_input/' + entry, './decoded_output/' + entry)
        console.log(index, "/" , len, `(${index / len * 100})`)
    })
}

main()