const fs = require('fs');
const jszip = require('jszip');

const unzip = async (zipFile) => {
    const fileContent = fs.readFileSync(zipFile)
    const jszipInstance = new jszip()
    const result = await jszipInstance.loadAsync(fileContent)

    for (let key of Object.keys(result.files)) {
        const item = result.files[key]
        if (item.dir) {
            // pass
        } else {
            const start = "let window = {};\n"
            const end = "\nreturn window;"
            const fileContent = await item.async('text')

            let F = new Function(start + fileContent + end)

            let content = JSON.stringify(F()._CCSettings)
            fs.writeFile(item.name + 'on', content, err => {
                if (err) {
                    console.error(err);
                }
                console.log('done')
            });
        }
    }
}

const myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);

unzip(myArgs[0])