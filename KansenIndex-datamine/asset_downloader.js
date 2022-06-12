const { XMLParser } = require("fast-xml-parser");
const { default: axios } = require("axios");
const fs = require('fs')

const AXISSENKI_SERVER = "http://resource.axis-senki.jp.s3.amazonaws.com"

async function downloadFile(fileUrl, outputLocationPath) {
    const writer = fs.createWriteStream(outputLocationPath);

    return axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream',
    }).then(response => {

        //ensure that the user can call `then()` only when the file has
        //been downloaded entirely.

        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on('error', err => {
                error = err;
                console.log(err)
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) {
                    resolve(true);
                }
                //no need to call the reject here, as it will have been called in the
                //'error' stream;
            });
        });
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


function fetch_asset_list() {
    let final_res = []

    function recursion_fetch(marker) {
        const url = AXISSENKI_SERVER + `${(marker !== "") ? "/?marker=" + marker : ""}`
        console.log('fetching', url)
        axios.get(url, {}).then(
            (res) => {
                //console.log(res)
                let parser = new XMLParser()
                let obj = parser.parse(res.data)
                final_res = final_res.concat(obj.ListBucketResult.Contents)
                console.log(final_res.length)
                if (obj.ListBucketResult.Contents.length === 1000) {
                    marker = obj.ListBucketResult.Contents[999].Key
                    recursion_fetch(marker)
                }
                else {
                    fs.writeFileSync('asset_list.json', JSON.stringify(final_res, {}, "  "))
                    console.log('done')
                }
            }
        )
    }
    recursion_fetch("")
}

async function download_asset() {
    const asset_list = require("./asset_list.json")

    for (let i = 142; i < asset_list.length; i++) {
        let filename = asset_list[i].Key
        console.log(`current progress: ${i * 100 / asset_list.length}% - at ${i + 1}/${asset_list.length}`)
        if (!filename.startsWith("Android") || filename === "Android/") continue
        await downloadFile(AXISSENKI_SERVER + '/' + filename, './asset_download/' + filename.replace('Android/', ""))
    }
}

//download_asset()

function mapASname() {
    let as_char = require('./generated_data/AS_char_map.json')
    const files = fs.readdirSync('./output')
    files.forEach((val) => {
        if (val === "error" || val === "Texture2D") return
        let comp = val.split('_')
        let id = parseInt(comp[0])
        let name = (id % 10000).toString()
        let found = as_char.find((item) => item.id == id)
        if (found) {
            name = found.name
        }
        else {
            as_char.push({id: id, name: name})
        }
        comp[0] = name
        let target_dir = comp.join("_")
        console.log(val, '\t\t->', target_dir)
        fs.renameSync('./output/' + val, './output/' + target_dir)
    })
    fs.writeFileSync('./generated_data/AS_char_map_manual.json', JSON.stringify(as_char, null, '\t'), {encoding: 'utf-8'})
}

mapASname()