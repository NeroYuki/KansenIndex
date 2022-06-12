const { XMLParser } = require("fast-xml-parser");
const { default: axios } = require("axios");
const fs = require('fs')
const cheerio = require('cheerio')

const PGSERVER = "http://39.107.69.185/cms/asyncResource/1615432444/zip/png/hero"

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

var $ = cheerio.load('<html></html>')

function fetch_asset_list() {
    let final_res = []
    $ = cheerio.load(fs.readFileSync('./sample_resource/PGpnglist.html'))
    $('a').map((index, el) =>  {
        const attributes = el.attribs
        //console.log(attributes.href)
        final_res.push(attributes.href)
    })
    return final_res
}

//fetch_asset_list()

async function download_asset() {
    const asset_list = fetch_asset_list()
    console.log(asset_list)
    for (let i = 5; i < asset_list.length; i++) {
        let filename = asset_list[i]
        console.log(`current progress: ${i * 100 / asset_list.length}% - at ${i + 1}/${asset_list.length}`)
        await downloadFile(PGSERVER + '/' + filename, './asset_download/' + filename)
        sleep(500)
    }
}

//download_asset()

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

function mapASname() {
    const files = fs.readdirSync('./output')
    files.forEach((val) => {
        if (val === "error" || val === "aki") return
        let comp = val.split('_')
        comp.shift()
        console.log(comp)
        comp[0] = capitalizeFirstLetter(comp[0])
        let target_dir = comp.join("_")
        console.log(val, '\t\t->', target_dir)
        fs.renameSync('./output/' + val, './output/' + target_dir)
    })
    //fs.writeFileSync('./generated_data/AS_char_map_manual.json', JSON.stringify(as_char, null, '\t'), {encoding: 'utf-8'})
}

mapASname()