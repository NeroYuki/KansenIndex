const fs = require('fs')
const { default: axios } = require("axios");
const equips = require("./generated_data/AL_equipment.json")
const equips_raw = require("./generated_data/AL_equipment_raw.json")
const sharp = require('sharp')

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
    const equip_array = Object.values(equips_raw)
    const bg = Array(6) 
    bg[0] = './rarity_frame/bg1.png'
    bg[1] = './rarity_frame/bg1.png'
    bg[2] = './rarity_frame/bg2.png'
    bg[3] = './rarity_frame/bg3.png'
    bg[4] = './rarity_frame/bg4.png'
    bg[5] = './rarity_frame/bg5.png'

    // let gear = await sharp(bg[5])
    //     .composite([
    //         { input: './gear_load/520.png', gravity: 'northwest', blend: 'atop' }
    //     ])
    //     .png()
    //     .toFile('./res_blend.png')

    equip_array.forEach(async (val) => {
        if (val.name && val.icon && val.icon !== "1" && val.rarity) {
            console.log(`${val.icon} - ${val.name} (${val.rarity})`)
            let icon_exist = fs.existsSync(`./gear_load/${val.icon}.png`)
            if (!icon_exist) {
                console.log('icon not found, skipping...')
                return
            }
            let filename = `./gear_out/${val.name.replace(/[\\/:*?\"<>|]/g, '')}_r${val.rarity}.png`
            try {
                let gear = await sharp(`./gear_load/${val.icon}.png`)
                    .resize(128, 128)
                    .toBuffer()

                await sharp(bg[val.rarity - 1])
                    .composite([
                        { input: gear, gravity: 'northwest', blend: 'atop' }
                    ])
                    .png()
                    .toFile(filename)
            
            }
            catch (e) {
                console.log('failed to create ' + filename)
            }
            console.log('saved ' + filename)
        }
    })
}

// async function main() {
//     const common = sharp('./rarity_frame/')
//     for (let i = 0; i < equips.length; i++) {
//         let filename = './gear_download/' + equips[i].id.replace(/[^\w\.!@#$^+=-]/g, '_') + '.png'
//         sharp(filename)
//             .
//     }
// }

main()

