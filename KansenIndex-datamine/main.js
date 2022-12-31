const { default: axios } = require("axios");
const fs = require('fs')
const cheerio = require('cheerio');
const { type } = require("os");

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


function mapWGToFileName() {
    let wg_char = require('./generated_data/WG_char_map.json')
    const files = fs.readdirSync('./output')
    files.forEach((val) => {
        if (!val.endsWith('.png')) return
        let comp = val.replace('.png','').split(' ')
        if (comp.length < 3) {
            console.log(val, comp.join('_'))
            return
        }
        let id = parseInt(comp[2])
        if (comp.length === 4) {
            comp[3] = 'alt_' + comp[3]
        }
        else if (id > 1000 && id < 3000) {
            comp.push('retrofit')
            id -= 1000
            comp[2] = id
        }
        else {
            comp.push('base')
        }
        if (comp[1] === 'BROKEN') comp.push('damage')
        
        let found = wg_char.find((item) => item.id == id)
        if (found) {
            comp[2] = found.name
        }
        else {
            //comp[2] = 'id' + comp[2]
            wg_char.push({id: id, name: id})
        }

        comp.shift()
        comp.shift()
        let target_dir = comp.join('_') + '.png'
        console.log(val, '\t\t->', target_dir)
        fs.renameSync('./output/' + val, './output/' + target_dir)
    })
    //fs.writeFileSync('./generated_data/WG_char_map_manual.json', JSON.stringify(wg_char, null, '\t'), {encoding: 'utf-8'})
}

//mapWGToFileName()

function fixWGName() {
    let wg_char = require('./generated_data/WG_char_map.json')
    const files = fs.readdirSync('./output')
    files.forEach((val) => {
        if (!val.endsWith('.png')) return
        let toEdit = val.split('_')[0]
        let id = parseInt(toEdit.replace('id', ''))
        let name = toEdit
        let found = wg_char.find((item) => item.id == id)
        if (found) {
            name = found.name
        }
        else {
            wg_char.push({id: id, name: toEdit})
        }
        let target_dir = val.replace(toEdit, name)
        console.log(val, '\t\t->', target_dir)
        fs.writeFileSync('./generated_data/WG_char_map_manual.json', JSON.stringify(wg_char, null, '\t'), {encoding: 'utf-8'})
        //fs.renameSync('./output/' + val, './output/' + target_dir)
    })
}

//fixWGName()

function fixBOName() {
    const files = fs.readdirSync('./output')
    files.forEach((val) => {
        let target_dir = val.replace('uipic_ui_lihui_', '').replace(/__/g, '_').replace('.png', '')
        let [cg_type, ship_name, is_damage, is_heavy_damage] = target_dir.split('_')
        if (!ship_name) return
        is_damage = (is_damage)? true : false
        is_heavy_damage = (is_heavy_damage)? true : false
        cg_type = (cg_type === "11")? "retrofit" : (cg_type === "1")? "base" : `alt_${cg_type}`
        console.log([ship_name, cg_type, is_damage, is_heavy_damage])
        target_dir = ship_name + "_" + cg_type + (is_damage ? "_damage": "") + (is_heavy_damage ? "-heavy" : "") + ".png"
        console.log(val, '\t\t->', target_dir)
        fs.renameSync('./output/' + val, './output/' + target_dir)
    })
}

//fixBOName()

function fixVCName() {
    const files = fs.readdirSync('./output')
    files.forEach((val) => {
        if (val === "error") return
        let comp = val.split('-')
        let id = parseInt(comp.shift())
        let target_dir = comp.join('-')
        if (id >= 11000) target_dir = target_dir.replace('_R', '_retrofit')
        console.log(val, '\t\t->', target_dir)
        fs.renameSync('./output/' + val, './output/' + target_dir)
    })
}

//fixVCName()

function fixLGName() {
    const files = fs.readdirSync('./output')
    let lg_char = require('./generated_data/LG_char_map.json')
    files.forEach((val) => {
        if (val === "error") return
        let comp = val.replace('.png', '').split('_')
        id = comp[0]
        let found = lg_char.find((item) => item.id == id)
        if (found) {
            comp[0] = found.name
        }
        else {
            lg_char.push({id: id, name: id})
        }

        if (comp[1]) {
            if (comp[1] === "h") comp[1] = 'oath'
            else comp[1] = "alt_" + comp[1]
        }
        let target_dir = comp.join('_') + ".png"
        console.log(val, '\t\t->', target_dir)
        fs.renameSync('./output/' + val, './output/' + target_dir)
    })
    fs.writeFileSync('./generated_data/LG_char_map_manual.json', JSON.stringify(lg_char, null, '\t'), {encoding: 'utf-8'})
}

// fixLGName()

//mapToFileName()
var $ = cheerio.load('<html></html>')

function getAzurLaneShipList() {
    let res = []
    $('.azl-shipcard > .alc-top > a').map((index, el) => {
        const attributes = el.attribs;
        res.push({link: attributes.href, name: attributes.title})
    })
    fs.writeFileSync('./generated_data/AL_char_map.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})
}

function getKanColleShipList() {
    let res = []
    $('a > img[alt!="Empty ship slot.png"]').map((index, el) => {
        const attributes = el.attribs;
        res.push({link: '/' + attributes.alt.replace(/ /g, "_"), name: attributes.alt})
    })
    fs.writeFileSync('./generated_data/KC_char_map.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})
}

async function getWarshipGirlShipList(url = "https://warship-girls.fandom.com/wiki/List_of_Warship_Girls/", page = 1, final_res = []) {
    console.log('fetching ' + url + page)
    axios.get(url + page, {}).then(
        (res) => {
            $ = cheerio.load(res.data)
            $('td').map((index, el) => {
                if ($("*", el).text().includes("N/A")) return
                const attributes = $('a', el).attr()
                if (!attributes) return
                const id = $('div', el).text().split(' ')[1]
                //console.log(el.attribs)
                final_res.push({id: id, link: attributes.href, name: attributes.title})
            })
            
            if (page < 22) {
                page += 1
                final_res = getWarshipGirlShipList(url, page, final_res)
            }
            else {
                fs.writeFileSync('./generated_data/WG_char_map.json', JSON.stringify(final_res, null, '\t'), {encoding: 'utf-8'})
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
    fs.writeFileSync('./generated_data/BO_char_map.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})
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
    let input = require('./generated_data/kc_cg_crawl_list.json')
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
    let input = require("./generated_data/BG_cg_crawl_list.json")
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

async function WG_CNWikiGetEligibleId() {
    const url = encodeURI("https://www.zjsnrwiki.com/wiki/舰娘图鉴")
    let page_res = await axios.get(url).catch((e) => err = e)
    let id_res = []
    if (page_res) {
        //console.log(page_res)
        const data = page_res.data
        $ = cheerio.load(data)

        // let ayy = $('center > b:contains("No. ")' ).contents()
        // console.log(ayy)
        $('center > b:contains("No. ")' ).toArray().map((v) => {
            //console.log(index)
            let id_text = $(v).text()
            id_res.push(parseInt(id_text.replace("No. ", "")))
        })
    }

    fs.writeFileSync('./generated_data/WG_valid_ship_id.json', JSON.stringify(id_res, null, '\t'), {encoding: 'utf-8'})

}

//WG_CNWikiGetEligibleId()


async function WG_CNWikiIterateGallery() {
    //FILENAME STRUCTURE: L_<NORMAL/BROKEN>_<SHIP_ID>[_<SKIN_ID>]
    let cg_list = require('./generated_data/WG_cg_crawl_list_final.json')
    let valid_id = require('./generated_data/WG_valid_ship_id.json')
    const BASE_SCAN_ONLY = true
    let isBroken = false
    let shipId = 1001
    let skinId = 0 

    let res = []

    const lastShipId = 1456
    //const url = "https://www.zjsnrwiki.com/wiki/%E6%96%87%E4%BB%B6:L_NORMAL_1.png"

    //TODO: iterate thisssssss

    process.on('SIGINT', () => {
        console.log('process interupted, logging current result...')
        fs.writeFileSync('./generated_data/WG_cg_crawl_list_new.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})
        console.log('Done, exiting')
        process.exit(0);
    })

    try {
        while (shipId <= lastShipId) {

            console.log(`currently checking ship id ${shipId} - skin id ${skinId} - ${(isBroken)? "Damage variant" : "Normal variant"}`)

            const filename = `L ${(isBroken)? "BROKEN" : "NORMAL"} ${shipId}${(skinId === 0)? "" : " " + skinId}.png`
            //console.log(filename)

            if (valid_id.findIndex((val) => val === shipId) === -1) {
                console.log('(-) Invalid ship Id existed')
                shipId += 1
                continue
            }

            if (cg_list.findIndex((val) => val.filename == filename) != -1) {
                console.log('(-) CG info existed')
                if (isBroken) {
                    isBroken = false
                    //skip skinId 2 for Tirpitz 
                    if (shipId === 7 && skinId === 1) skinId += 2 
                    //check alternate outfit if ship is not retrofit or base scan option is false
                    else if (shipId < 1000 && !BASE_SCAN_ONLY) skinId += 1
                    else { shipId += 1}
                }
                else {
                    isBroken = true
                }
                continue
            }
            let err = null

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
                    console.log("url found ", attributes.href)
                    res.push({url: attributes.href, filename: attributes.title})
                })
                await sleep(1000)

                if (isBroken) {
                    isBroken = false
                    //skip skinId 2 for Tirpitz 
                    if (shipId === 7 && skinId === 1) skinId += 2 
                    //check alternate outfit if ship is not retrofit or base scan option is false
                    else if (shipId < 1000 && !BASE_SCAN_ONLY) skinId += 1
                    else { shipId += 1}
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

    fs.writeFileSync('./generated_data/WG_cg_crawl_list_new.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})

    console.log(res)
}

//WG_CNWikiIterateGallery()

function updateALCGList() {
    //new verison file here
    let data = require('./generated_data/AL_ships_v3.json')
    let original_data = require('./generated_data/cg_crawl_list.json')
    //console.log(data.length)
    let res = []
    data.forEach((ship) => {
        ship.skins.forEach((skin) => {
            if (original_data.findIndex((entry) => (ship.names.en === entry.ship && skin.name === entry.skin)) !== -1) {
                return
            }
            else {console.log(`new cg found for: ${ship.names.en} - ${skin.name}`)}
            res.push({ship: ship.names.en, skin: skin.name, filename: `${ship.names.en}_${skin.name}.png`, url: skin.image})
            if (skin.cn) res.push({ship: ship.names.en, skin: skin.name, filename: `${ship.names.en}_${skin.name}_cn.png`, url: skin.cn})
            if (skin.bg) res.push({ship: ship.names.en, skin: skin.name, filename: `${ship.names.en}_${skin.name}_bg.png`, url: skin.bg})
        })
    })
    fs.writeFileSync('./generated_data/AL_cg_crawl_list_new.json', JSON.stringify(res, null, '\t'), {encoding: 'utf-8'})
}

//updateALCGList()

async function main2() {
    // $ = cheerio.load(fs.readFileSync('./KCshiplist.html'))
    // getKanColleShipList()
    // $ = cheerio.load(fs.readFileSync('./ALshiplist.html'))
    // getAzurLaneShipList()
    // getWarshipGirlShipList()
    // $ = cheerio.load(fs.readFileSync('./BOshiplist.html'))
    // getBlueOathShipList()
    // ALWikiPageFileCrawl()


    // const KC_char_map = require('./generated_data/KC_char_map.json')
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
    // fs.writeFileSync('./generated_data/kc_cg_crawl_list.json', JSON.stringify(KC_list, null, '\t'), {encoding: 'utf-8'})
    // fs.writeFileSync('./generated_data/kc_cg_crawl_error.json', JSON.stringify(error_list, null, '\t'), {encoding: 'utf-8'})

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

    //getWarshipGirlShipList()

}

//main2()

async function main() {
    let input = require('./generated_data/WG_cg_crawl_list_new_cloud.json')
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
 
//main()