
const { default: axios } = require("axios");
const fs = require('fs')
const cheerio = require('cheerio');

const TARGET = "https://zh.moegirl.org.cn"

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
    let final_res = new Map()
    $ = cheerio.load(fs.readFileSync('./sample_resource/BGSMshiplist.html'))
    $('a').map((index, el) =>  {
        const attributes = el.attribs
        //console.log(attributes.href)
        if (!attributes.title || !attributes.href) return
        if (attributes.title.startsWith('钢铁少女:') && !attributes.href.startsWith('/index.php')) {
            final_res.set(attributes.title.replace('钢铁少女:', ''), attributes.href)
        }
    })
    //console.log(final_res.values)
    let arr = []
    final_res.forEach (function(value, key) {
        arr.push({title: key, link: value})
    })
    fs.writeFileSync('./generated_data/BGSM_char_map.json', JSON.stringify(arr, null, '\t'), {encoding: 'utf-8'})
}

//fetch_asset_list()
let cg_res = []
function fetch_imagelink(data) {

    $ = cheerio.load(data)
    $('.TabContentText > div > div > div > a > img').map((index, el) =>  {
        const attributes = el.attribs
        //console.log(attributes.href)
        let link = attributes.src.slice(0, attributes.src.lastIndexOf('/')).replace('thumb/', '')
        let title = attributes.alt
        console.log({title: title, link: link})
        cg_res.push({title: title, link: link})
    })
    $('.TabContentText > a > img').map((index, el) =>  {
        const attributes = el.attribs
        //console.log(attributes.href)
        let link = attributes.src.slice(0, attributes.src.lastIndexOf('/')).replace('thumb/', '')
        let title = attributes.alt
        console.log({title: title, link: link})
        cg_res.push({title: title, link: link})
    })
    //console.log(final_res)
}

async function main() {
    const a = require('./generated_data/BGSM_char_map.json')
    cg_res = require('./generated_data/BGSM_cg_crawl_list_new.json')

    // process.on('SIGINT', () => {
    //     console.log('process interupted, logging current result...')
    //     fs.writeFileSync('./generated_data/BGSM_cg_crawl_list_new.json', JSON.stringify(cg_res, null, '\t'), {encoding: 'utf-8'})
    //     console.log('Done, exiting')
    //     process.exit(0);
    // })

    // for (let i = 29; i < 32; i++) {
    //     console.log('requesting ' + a[i].link + `(${i + 1}/${a.length})`)
    //     try {
    //         let res = await axios.get(TARGET + a[i].link)
    //         if (res.status === 200 && res.data) {
    //             console.log('fetching image link...')
    //             fetch_imagelink(res.data)
    //         }
    //     }
    //     catch (err) {
    //         console.log('error requesting')
    //         fs.writeFileSync('./generated_data/BGSM_cg_crawl_list_new.json', JSON.stringify(cg_res, null, '\t'), {encoding: 'utf-8'})
    //         console.log('Done, exiting')
    //     }
    //     await sleep(2000)
    // }
    // fs.writeFileSync('./generated_data/BGSM_cg_crawl_list_new.json', JSON.stringify(cg_res, null, '\t'), {encoding: 'utf-8'})
    // console.log('Done, exiting')

    for (let i = 21; i < cg_res.length; i++) {
        let filename = cg_res[i].title
        console.log(`current progress: ${i * 100 / cg_res.length}% - at ${i + 1}/${cg_res.length}`)
        await downloadFile(cg_res[i].link, './output/' + filename)
    }
}

main()