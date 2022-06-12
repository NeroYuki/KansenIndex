
const fs = require('fs')

const rc4key = "GvRgbuKfZ31Qr8xB"

function rc4(e, t) {
    for (
        var i, n = [], r = 0, o = new Uint8Array(t.length), a = 0;
        a < 256;
        a++
    )
        n[a] = a;
    for (a = 0; a < 256; a++) {
        r =
            (r + n[a] + rc4key.charCodeAt(a % rc4key.length)) %
            256;
        i = n[a];
        n[a] = n[r];
        n[r] = i;
    }
    a = 0;
    r = 0;
    for (var c = 0; c < t.length; c++) {
        r = (r + n[(a = (a + 1) % 256)]) % 256;
        i = n[a];
        n[a] = n[r];
        n[r] = i;
        o[c] = t[c] ^ n[(n[a] + n[r]) % 256];
    }
    return o;
}


let data = fs.readFileSync("./image.astc", {encoding: 'base64'})

//console.log(data)

let out = rc4("testkey", data)

let final = (Buffer.from(out, 'binary')).toString('utf-8')
fs.writeFileSync('rc4_decoded_file.png', final)


//console.log(out)