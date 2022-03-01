const { default: axios } = require("axios");
const fs = require('fs')
const cheerio = require('cheerio')

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

async function main() {
    let input = require('./AL_cg_crawl_list_new.json')
    for (let i = 0; i < input.length; i++) {
        console.log(`current progress: ${i * 100 / input.length}% - at ${i + 1}/${input.length}`)
        const url = input[i].url
        const filename = input[i].filename.replace(/[\\\/\:\*\?\"\<\>\|]/g, "")
        if (fs.existsSync('./output/' + filename)) {
            console.log('skip ' + filename)
            continue
        }
        let err = ""
        let res = await downloadFile(url, './output/' + filename).catch((e) => {err = e})
        if (err) { console.log('error download ' + filename + ' : ' + err); continue }
        console.log('downloaded ' + filename)
        await sleep(2000)
    }
    console.log('done.')
}
 
// main()

// axios.get("https://darkboom.miraheze.org/w/index.php?title=Special:MIMESearch&limit=500&offset=500&mime=image%2F%2A", {}).then(
//     (res) => {
//         let res_string = ""
//         let lines = res.data.split('\n')
//         lines.forEach((val) => {
//             if (val.includes("File:Character overview ")) {
//                 const regex = /https\:\/\/static\.miraheze\.org\/darkboomwiki.+?\.png/g;
//                 const found = val.match(regex);
//                 if (found && found[0]) {
//                     res_string += found[0] + "\n"
//                 }
//             }
//         })
//         fs.appendFileSync('./res.txt', res_string, {encoding: 'utf-8'})
//     }, 
//     (err) => {
//         console.log(err)
//     }   
// )

function indentifyType() {
    //ship girl asset id have 7 number.
    //4 first number for ship
    //3 later number following (000 - normal, 001-099 - alt outfit, 100 - abysal form, 101-899 - alt abyssal, 900 - no rigging)
    let file_list = fs.readdirSync('./output', {})
    let resolve_filelist = []
    file_list.forEach((val) => {
        let asset_id = val.split('_')[2].replace('.png', '')
        let type_id = parseInt(asset_id.slice(-3))
        let type = (type_id === 0) ? "normal" :
            (type_id === 100) ? "abyssal" :
            (type_id === 800) ? "abyssal_no_rigging" :
            (type_id === 900) ? "no_rigging" : "alt_" + type_id
        let char_id = asset_id.slice(0, asset_id.length - 3)
        if (char_id.length === 4) {
            resolve_filelist.push([val, asset_id, type_id, type, char_id])
        }
    })
    return (resolve_filelist)
}

//indentifyType()

function getShipId() {
    axios.get('https://darkboom.miraheze.org/wiki/Dolls', {}).then(
        (res) => {
            let res_string = []
            let lines = res.data.split('\n')
            lines.forEach((val, index) => {
                if (val.includes("img alt=\"Character icon")) {
                    let char_id = lines[index + 2].replace('<td>', '').replace('</td>', '')
                    let char_name = lines[index + 3].replace('<td>', '').replace('</td>', '')
                    res_string.push({
                        char_id: char_id,
                        char_name: char_name
                    })
                }
            })
            fs.writeFileSync('char_map.json', JSON.stringify(res_string, null, '\t'), {encoding: 'utf-8'})
        },
        (err) => {
            console.log(err)
        }
    )
}

//getShipId()

function mapToFileName() {
    let id_array = indentifyType()
    let char_array = require('./char_map.json')
    id_array.forEach((val, index) => {
        let found = char_array.find((char) => char.char_id === val[4])
        let name = (found) ? found.char_name : "Unknown"
        id_array[index] = id_array[index].concat([name, name + "_" + val[3] + ".png"])
        fs.renameSync('./output/' + id_array[index][0], './output/' + id_array[index][6])
    })
    console.log('done')
}

//mapToFileName()
var $ = cheerio.load('<html></html>')

function getAzurLaneShipList() {
    let res = []
    $('.azl-shipcard > .alc-top > a').map((index, el) => {
        const attributes = el.attribs;
        res.push({link: attributes.href, name: attributes.title})
    })
    fs.writeFileSync('AL_char_map.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})
}

function getKanColleShipList() {
    let res = []
    $('a > img[alt!="Empty ship slot.png"]').map((index, el) => {
        const attributes = el.attribs;
        res.push({link: '/' + attributes.alt.replace(/ /g, "_"), name: attributes.alt})
    })
    fs.writeFileSync('KC_char_map.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})
}

async function getWarshipGirlShipList(url = "https://warship-girls.fandom.com/wiki/List_of_Warship_Girls/", page = 1, final_res = []) {
    console.log('fetching ' + url + page)
    axios.get(url + page, {}).then(
        (res) => {
            $ = cheerio.load(res.data)
            $('td > a').map((index, el) => {
                const attributes = el.attribs;
                //console.log(el.attribs)
                final_res.push({link: attributes.href, name: attributes.title})
            })
            if (page < 22) {
                page += 1
                final_res = getWarshipGirlShipList(url, page, final_res)
            }
            else {
                fs.writeFileSync('WG_char_map.json', JSON.stringify(final_res, null, '\t'), {encoding: 'utf-8'})
            }
        },
        (err) => {
            console.log(err)
        }
    )
}

function getBlueOathShipList() {
    let res = []
    $('tr > td:nth-child(3) > a').map((index, el) => {
        const attributes = el.attribs;
        res.push({link: attributes.href, name: attributes.title})
    })
    fs.writeFileSync('BO_char_map.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})
}

function ALWikiPageFileCrawl() {
    $ = cheerio.load(fs.readFileSync('./ALwikicrawl_sample.html'))
    $('div.shipskin-image > a > img').map((index, el) =>  {
        const attributes = el.attribs;
        let arr = attributes.src.replace('thumb/', '').split('/')
        arr.pop()
        console.log(arr.join('/'))
    })
}

var KC_list = []
var error_list = []
var BO_list = []
var WG_list = []
var BG_list = []

function KCWikiPageFileCrawl(data, entry) {
    $ = cheerio.load(data)
    let ship_name = ""
    try {
        ship_name = $('title').text().replace('- Kancolle Wiki', '').trim()
    }
    catch (e) {
        console.log(`${entry.name} parse error, skipping`)
        error_list.push(entry)
        return
    }

    if (KC_list.findIndex(val => val.ship === ship_name) !== -1) {
        console.log(`${ship_name} duplicate, skipping`)
        return
    }
    
    try {
        let temp = []
        $('.gallerybox > div').map((index, el) =>  {
            const test = $('.thumb > div > a > img', el).attr()
            let arr = test.src.replace('thumb/', '').split('/')
            arr.pop()
            const link =  arr.join('/')
            const test2 = $('.gallerytext > p', el).text()
            const name = test2.trim().replace(/\s{2,}/g, ' ')
            // const attributes = el.attribs;
            const obj = {ship: ship_name, skin: name, link: link}
            console.log(obj)
            temp.push(obj)
        })
        KC_list = KC_list.concat(temp)
    }
    catch (e) {
        console.log(`${entry.name} parse error, skipping`)
        error_list.push(entry)
        return
    }
}

function BOWikiPageFileCrawl(data, entry) {
    $ = cheerio.load(data)
    
    try {
        let temp_name = []
        let temp_link = []
        $('.tabs-label').map((index, el) =>  {
            const name = $(el).html().trim().replace(/\s{2,}/g, ' ')
            console.log(name)
            temp_name.push(name)
        })

        $('.tabs-content > p > a.image > img').map((index, el) =>  {
            const attributes = el.attribs
            let arr = attributes.src.replace('thumb/', '').split('/')
            arr.pop()
            const link =  arr.join('/')
            temp_link.push(link)
        })

        for (let j = 0; j < temp_name.length || j < temp_link.length; j++) {
            BO_list.push({ship: entry.name, skin: temp_name[j], link: temp_link[j]})
        }
        //console.log(BO_list)
    }
    catch (e) {
        console.log(`${entry.name} parse error, skipping `, e)
        error_list.push(entry)
        return
    }
}

function WGWikiPageFileCrawl(data, entry) {
    $ = cheerio.load(data)
    let $illust = $('tbody:contains("Illustration") > tr > th > div.tabber')
    //console.log($illust)
    let name = ""
    try {
        $('a.image', $illust).map((index, el) =>  {
            const attributes = el.attribs
            //discard rarity background
            if (attributes.href.includes('Rarity')) return
            let link = attributes.href.replace(/\/revision\/.*/, "")
            let skin = ""
            //assume first filename is base
            if (index == 0) {
                name = link.split('/').reverse()[0].replace('.png', '')
                skin = ""
            }
            else {
                skin = decodeURI(link.split('/').reverse()[0].replace('.png', '').replace(name + '_', " ").trim())
            }
            //resolve file name from link
            const obj = {name: name, skin: skin, link: link}
            console.log(obj)
            WG_list.push(obj)
        })
    }
    catch (e) {
        console.log(`${entry.name} parse error, skipping`)
        error_list.push(entry)
        return
    }
}

async function crawlCG4KanColle() {
    let input = require('./kc_cg_crawl_list.json')
    for (let i = 0; i < input.length; i++) {
        console.log(`current progress: ${i * 100 / input.length}% - at ${i + 1}/${input.length}`)
        const url = input[i].link
        const filename = (input[i].ship + "_" + input[i].skin + ".png").replace(/[\\\/\:\*\?\"\<\>\|]/g, "")
        if (fs.existsSync('./output/' + filename)) {
            console.log('skip ' + filename)
            continue
        }
        let err = ""
        let res = await downloadFile(url, './output/' + filename).catch((e) => {err = e})
        if (err) { console.log('error download ' + filename + ' : ' + err); continue }
        console.log('downloaded ' + filename)
        await sleep(2000)
    }
    console.log('done.')
}

async function crawlCG4BlueOath() {
    let input = require(data)
    for (let i = 0; i < input.length; i++) {
        console.log(`current progress: ${i * 100 / input.length}% - at ${i + 1}/${input.length}`)
        const filename = (input[i].ship + "_" + input[i].skin + ".png").replace(/[\\\/\:\*\?\"\<\>\|]/g, "")
        if (!input[i].link) {
            console.log('no link found, skip ' + filename)
            continue
        }
        const url = input[i].link
        if (fs.existsSync('./output/' + filename)) {
            console.log('already downloaded, skip ' + filename)
            continue
        }
        let err = ""
        let res = await downloadFile(url, './output/' + filename).catch((e) => {err = e})
        if (err) { console.log('error download ' + filename + ' : ' + err); continue }
        console.log('downloaded ' + filename)
        await sleep(2000)
    }
    console.log('done.')
}

async function crawlCG4WarshipGirl() {
    let input = require('./WG_cg_crawl_list.json')
    for (let i = 0; i < input.length; i++) {
        console.log(`current progress: ${i * 100 / input.length}% - at ${i + 1}/${input.length}`)
        const url = input[i].link
        const filename = (input[i].name + ((input[i].skin !== "") ? "_" + input[i].skin : "") + ".png").replace(/[\\\/\:\*\?\"\<\>\|]/g, "")
        if (fs.existsSync('./output/' + filename)) {
            console.log('skip ' + filename)
            continue
        }
        let err = ""
        let res = await downloadFile(url, './output/' + filename).catch((e) => {err = e})
        if (err) { console.log('error download ' + filename + ' : ' + err); continue }
        console.log('downloaded ' + filename)
        await sleep(2000)
    }
    console.log('done.')
}

async function crawlCG4BattleshipGirl() {
    let input = require("./BG_cg_crawl_list.json")
    for (let i = 0; i < input.length; i++) {
        console.log(`current progress: ${i * 100 / input.length}% - at ${i + 1}/${input.length}`)
        const filename = (input[i].name + "_" + input[i].skin + ".jpg").replace(/[\\\/\:\*\?\"\<\>\|]/g, "")
        if (!input[i].link) {
            console.log('no link found, skip ' + filename)
            continue
        }
        const url = input[i].link
        if (fs.existsSync('./output/' + filename)) {
            console.log('already downloaded, skip ' + filename)
            continue
        }
        let err = ""
        let res = await downloadFile(url, './output/' + filename).catch((e) => {err = e})
        if (err) { console.log('error download ' + filename + ' : ' + err); continue }
        console.log('downloaded ' + filename)
        await sleep(2000)
    }
    console.log('done.')
}

async function BGCGPageFileCraw(data) {
    $ = cheerio.load(data)

    const ship_name = $('p > .tc > strong').text()

    $('article > p > a > img').map((index, el) =>  {
        const attributes = el.attribs
        const skin = (index === 0) ? "base" : "damaged" 
        const link = attributes.src.replace('_S.jpg', '.jpg')
        console.log({name: ship_name, skin: skin, link: link})
        BG_list.push({name: ship_name, skin: skin, link: link})
    })
}


async function WG_CNWikiIterateGallery() {
    //FILENAME STRUCTURE: L_<NORMAL/BROKEN>_<SHIP_ID>[_<SKIN_ID>]
    let isBroken = false
    let shipId = 1
    let skinId = 0 

    let res = []

    const lastShipId = 50
    //const url = "https://www.zjsnrwiki.com/wiki/%E6%96%87%E4%BB%B6:L_NORMAL_1.png"

    //TODO: iterate thisssssss

    process.on('SIGINT', () => {
        console.log('process interupted, logging current result...')
        fs.writeFileSync('WG_cg_crawl_list_new.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})
        console.log('Done, exiting')
        process.exit(0);
    })

    try {
        while (shipId <= lastShipId) {
            let err = null

            console.log(`currently checking ship id ${shipId} - skin id ${skinId} - ${(isBroken)? "Damage variant" : "Normal variant"}`)

            const url = `https://www.zjsnrwiki.com/wiki/%E6%96%87%E4%BB%B6:L_${(isBroken)? "BROKEN" : "NORMAL"}_${shipId}${(skinId === 0)? "" : "_" + skinId}.png`
            console.log('trying ' + url)

            let page_res = await axios.get(url).catch((e) => err = e)
            if (err) {
                console.log("[x] no image found, go to new ship...")
                await sleep(1000)

                if (skinId > 0) skinId = 0
                if (isBroken) isBroken = false

                shipId += 1
            }
            else if (page_res) {
                const data = page_res.data
                $ = cheerio.load(data)

                $('.fullMedia > p > a' ).map((index, el) => {
                    const attributes = el.attribs;
                    res.push({url: attributes.href, filename: attributes.title})
                })
                await sleep(1000)

                if (isBroken) {
                    isBroken = false
                    skinId += 1
                }
                else {
                    isBroken = true
                }
            }
            else {
                console.log(`[x] error in requesting page,  go to new ship...`)
                await sleep(1000)

                if (skinId > 0) skinId = 0
                if (isBroken) isBroken = false

                shipId += 1
            }
        }
    }
    catch (err) {
        console.log('unindentified error happened, exiting...')
    }

    fs.writeFileSync('WG_cg_crawl_list_new.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})

    console.log(res)
}

async function main2() {
    // $ = cheerio.load(fs.readFileSync('./KCshiplist.html'))
    // getKanColleShipList()
    // $ = cheerio.load(fs.readFileSync('./ALshiplist.html'))
    // getAzurLaneShipList()
    // getWarshipGirlShipList()
    // $ = cheerio.load(fs.readFileSync('./BOshiplist.html'))
    // getBlueOathShipList()
    // ALWikiPageFileCrawl()
    // let data = require('./AL_ships_v2.json')
    // let original_data = require('./cg_crawl_list.json')
    // //console.log(data.length)
    // let res = []
    // data.forEach((ship) => {
    //     ship.skins.forEach((skin) => {
    //         if (original_data.findIndex((entry) => (ship.names.en === entry.ship && skin.name === entry.skin)) !== -1) {
    //             return
    //         }
    //         else {console.log(`new cg found for: ${ship.names.en} - ${skin.name}`)}
    //         res.push({ship: ship.names.en, skin: skin.name, filename: `${ship.names.en}_${skin.name}.png`, url: skin.image})
    //         if (skin.cn) res.push({ship: ship.names.en, skin: skin.name, filename: `${ship.names.en}_${skin.name}_cn.png`, url: skin.cn})
    //         if (skin.bg) res.push({ship: ship.names.en, skin: skin.name, filename: `${ship.names.en}_${skin.name}_bg.png`, url: skin.bg})
    //     })
    // })
    // fs.writeFileSync('AL_cg_crawl_list_new.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})

    // const KC_char_map = require('./KC_char_map.json')
    // for (let  i = 0; i < KC_char_map.length; i++) { 
    //     console.log(`(${i}/${KC_char_map.length}) checking ${KC_char_map[i].name}`)
    //     let res = await axios.get(`https://en.kancollewiki.net${KC_char_map[i].link}`)
    //     if (res) {
    //         KCWikiPageFileCrawl(res.data, KC_char_map[i])
    //         await sleep(2000)
    //     }
    //     else {
    //         console.log(`error in requesting page, skipping ${KC_char_map[i].name}`)
    //         await sleep(2000)
    //     }
    // }
    // fs.writeFileSync('kc_cg_crawl_list.json', JSON.stringify(KC_list, null, '\t'), {encoding: 'utf-8'})
    // fs.writeFileSync('kc_cg_crawl_error.json', JSON.stringify(error_list, null, '\t'), {encoding: 'utf-8'})

    //crawlCG4KanColle()

    //BOWikiPageFileCrawl()

    // const BO_char_map = require('./BO_char_map.json')
    // for (let  i = 0; i < BO_char_map.length; i++) { 
    //     console.log(`(${i}/${BO_char_map.length}) checking ${BO_char_map[i].name}`)
    //     let res = await axios.get(`https://blueoath.miraheze.org${BO_char_map[i].link}`)
    //     if (res && (res.status !== 404 || res.status !== 500)) {
    //         BOWikiPageFileCrawl(res.data, BO_char_map[i])
    //         await sleep(2000)
    //     }
    //     else {
    //         console.log(`error in requesting page, skipping ${BO_char_map[i].name}`)
    //         await sleep(2000)
    //     }
    // }
    // fs.writeFileSync('BO_cg_crawl_list.json', JSON.stringify(BO_list, null, '\t'), {encoding: 'utf-8'})
    // fs.writeFileSync('BO_cg_crawl_error.json', JSON.stringify(error_list, null, '\t'), {encoding: 'utf-8'})

    //crawlCG4BlueOath()
    // const WG_char_map = require('./WG_char_map.json')
    // for (let  i = 0; i < WG_char_map.length; i++) { 
    //     console.log(`(${i}/${WG_char_map.length}) checking ${WG_char_map[i].name}`)
    //     let res = await axios.get(`https://warship-girls.fandom.com${WG_char_map[i].link}`)
    //     if (res && (res.status !== 404 || res.status !== 500)) {
    //         WGWikiPageFileCrawl(res.data, WG_char_map[i])
    //         await sleep(2000)
    //     }
    //     else {
    //         console.log(`error in requesting page, skipping ${WG_char_map[i].name}`)
    //         error_list.push(WG_char_map[i])
    //         await sleep(2000)
    //     }
    // }
    // fs.writeFileSync('WG_cg_crawl_list.json', JSON.stringify(WG_list, null, '\t'), {encoding: 'utf-8'})
    // fs.writeFileSync('WG_cg_crawl_error.json', JSON.stringify(error_list, null, '\t'), {encoding: 'utf-8'})

    // for (let  i = 1; i <= 148; i++) { 
    //     console.log(`(${i}/${148})`)
    //     let append_page = (i === 1) ? "" : "_" + i
    //     let res = await axios.get(`https://wap.gamersky.com/sygl/Content-722604${append_page}.html`)
    //     if (res && (res.status !== 404 || res.status !== 500)) {
    //         BGCGPageFileCraw(res.data)
    //         await sleep(1000)
    //     }
    //     else {
    //         console.log(`error in requesting page, skipping ${i}`)
    //         await sleep(1000)
    //     }
    // }
    // fs.writeFileSync('BG_cg_crawl_list.json', JSON.stringify(BG_list, null, '\t'), {encoding: 'utf-8'})

    //BGCGPageFileCraw(fs.readFileSync('BGCGcrawl_sample.html'))
    //crawlCG4WarshipGirl()

    //crawlCG4BattleshipGirl()

    WG_CNWikiIterateGallery()
}

main2()