const { default: axios } = require("axios");
const fs = require('fs')

function indentifyType() {
    //ship girl asset id have 7 number.
    //4 first number for ship
    //3 later number following (000 - normal, 001-099 - alt outfit, 100 - abysal form, 101-899 - alt abyssal, 900 - no rigging)

    let file_list = fs.readdirSync('./output', {})
    let resolve_filelist = []
    file_list.forEach((val) => {
		if (val === "error" || val === "aki") return
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
                    let char_name = lines[index + 3].replace('<td>', '').replace('</td>', '').replace(/<a.*?>/, '').replace('</a>', '')
                    res_string.push({
                        char_id: char_id,
                        char_name: char_name
                    })
                }
            })
            fs.writeFileSync('./generated_data/DB_char_map.json', JSON.stringify(res_string, null, '\t'), {encoding: 'utf-8'})
        },
        (err) => {
            console.log(err)
        }
    )
}

//getShipId()

function mapToFileName() {
    let id_array = indentifyType()
    let char_array = require('./generated_data/DB_char_map.json')
    id_array.forEach((val, index) => {
		if (val === "error" || val === "aki") return
        let found = char_array.find((char) => char.char_id === val[4])
        let name = (found) ? found.char_name : "id" + id_array[index][4]
        id_array[index] = id_array[index].concat([name, name + "_" + val[3] + ".png"])
		//console.log(id_array[index][0], '\t\t->', id_array[index][6])
        fs.renameSync('./output/' + id_array[index][0], './output/' + id_array[index][6])
    })
	//console.table(id_array)
    console.log('done')
}

mapToFileName()