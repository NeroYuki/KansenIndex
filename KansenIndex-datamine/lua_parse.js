const fs = require('fs')

let files = fs.readdirSync('./lua_input')


let obj_list = []

files.forEach(filename => {
    let data = fs.readFileSync('./lua_input/' + filename, {encoding: 'utf-8'})
    let lines = data.split('\n')

    let parse_object = 0
    let obj = {}

    lines.forEach(val => {
        if (val.trim() === "{" && !parse_object) {
            parse_object = 1
            //console.log('parsing object')
            return 
        }

        if (val.trim().replace(';', '') === "}" && parse_object) {
            obj_list.push(obj)
            obj = {}
            parse_object = 0
            return
        }

        if (parse_object) {
            if (!val.includes('=')) return
            let comp = val.split('=')

            if (!(val[1].trim())) return

            let key = comp[0].trim()
            let value = comp[1].trim().replace(',', '').replace(/\[/g, '').replace(/\]/g, '')

            obj[key] = value
        }
    })
})

fs.writeFileSync('lua_out.json', JSON.stringify(obj_list, {}, '  '), {encoding: 'utf-8'})
console.log('done')