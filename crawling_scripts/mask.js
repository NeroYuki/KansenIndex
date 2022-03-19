
const Jimp = require('jimp');
const fs = require('fs')

// Jimp.read('./masking_input/106_a.png')
//     .then(image => {
//         image
//             .resize(512, 512)
//             .write('./masking_input/106_a_512px.png', (err) => {
//                 if (err) throw err
//                 console.log('image resized')
//             })
//     })
//     .catch(err => {
//         console.log(err)
//     });

function upscaleMask() {
    let files_array = fs.readdirSync('masking_input')
    files_array.forEach((file) => {
        Jimp.read('./masking_input/' + file)
            .then(image => {
                image
                    .resize(512, 512)
                    .write('./masking_input/' + file, (err) => {
                        if (err) throw err
                        console.log('resized ' + file)
                    })
            })
            .catch(err => {
                console.log(err)
            });
    })
}

//upscaleMask()

function maskAlpha() {
    let files_array = fs.readdirSync('image_input')
    files_array.forEach(async (file) => {
        let alpha_file = file.replace('.png', '_a.png')
        let image = await Jimp.read('./image_input/' + file)
        let alpha_mask = await Jimp.read('./masking_input/' + alpha_file)

        alpha_mask.scan(0, 0, alpha_mask.bitmap.width, alpha_mask.bitmap.height, (x, y, idx) => {
            let alpha = alpha_mask.bitmap.data[idx + 3];
            let color = image.getPixelColor(x, y)
            image.setPixelColor(color - (color % 256) + alpha, x, y)
        })
        image.write('./masking_output/' + file, (err) => {
            if (err) throw err
            console.log('image masked ' + file)
        })
    })
}

maskAlpha()

// Jimp.read('./masking_input/106.png')
//     .then(async (image) => {
//         let mask = await Jimp.read('./masking_input/106_a_512px.png')
//         mask.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
//             let alpha = mask.bitmap.data[idx + 3];
//             if (alpha < 128) image.setPixelColor(0x00000000, x, y)
//         })
//         image
//             .write('./masking_output/106.png', (err) => {
//                 if (err) throw err
//                 console.log('image masked')
//             })
//     })
//     .catch(err => {
//         console.log(err)
//     });