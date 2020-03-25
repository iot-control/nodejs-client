
const net = require('net');
var crypto = require('crypto');


function SecureSignallingClient(options, cmdSend, cb){
    const promise = new Promise(function(resolve, reject){
        
        let reqHash = crypto.createHmac('sha256', options.hmacKey);
        reqHash.setEncoding('binary');
        
        let resHash = Buffer.allocUnsafe(options.hashByteLength);
        let gotBytes = Buffer.allocUnsafe(options.randDataLength);
        let gotBytesNum = 0;

        let res = null;    // The final analyzed response

        var client = new net.Socket();
        client.connect(options.port, options.ip, ()=>{
            gotBytesNum = 0;
            if(typeof options.onConnect === 'function') options.onConnect();
            client.write('X'); //necessary for the arduino ethernet library
        });

        client.on('error', (err) => {
            reject(err);
        });

        client.on('close', function() {
            if(res === null) reject(new Error('Connection closed before the response was sent.'));
            else resolve(res);
        });

        client.on('data', (data) => {
            gotBytesNum += data.length;

            if(gotBytesNum <= options.randDataLength){
                reqHash.update(Buffer.from(data), 'binary');
                for(i=0; i<data.length; i++){
                    gotBytes[gotBytesNum - data.length + i] = data[i];
                }
            }

            if(gotBytesNum == options.randDataLength){

                reqHash.update(Buffer.from([cmdSend.cmd]), 'binary');
                reqHash.end(); // very important! You cannot read from the stream until you have called end()

                var sha256sum = reqHash.read();
                client.write(sha256sum, 'binary');
                //printHash(sha256sum);
            }

            if(gotBytesNum > options.randDataLength){
                if (gotBytesNum > (options.randDataLength + options.hashByteLength)) reject(new Error('Server returned more bytes than expeced'));
                
                for(i=0; i<data.length; i++)
                    resHash[gotBytesNum - options.randDataLength - data.length + i] = data[i];

                if (gotBytesNum == (options.randDataLength + options.hashByteLength)){
                    res = analyzeResponse(options.hmacKey, cmdSend, gotBytes, resHash);
                    client.destroy(); // kill client after server's response       
                }
            }
        });

    });

    if (cb && typeof cb == 'function'){
        promise.then(cb.bind(null, null), cb);
    }
    return promise;
}


function analyzeResponse(hmacKey, cmdSend, gotBytes, resHash){
    for(i=0; i<cmdSend.responses.length; i++){
        let testHash = Buffer.from(getHash(gotBytes, hmacKey, [cmdSend.responses[i]]), 'binary');
        if (hashesAreTheSame(resHash, testHash)){
            return cmdSend.responses[i];
        }
    }
    return undefined;
}

function getHash(data, key, additionalData){
    let checkHash = crypto.createHmac('sha256', key);
    checkHash.setEncoding('binary');
    checkHash.update(data, 'binary');

    checkHash.update(Buffer.from(additionalData));

    checkHash.end();
    return checkHash.read();
}

function hashesAreTheSame(hash1, hash2){
    if (hash1.length != hash2.length) return false;
    for (j=0; j<hash1.length; j++) if(hash1[j] != hash2[j]) return false;
    return true;
}

// function printHash(hash){
//     let str = '';
//     for (i=0; i<hash.length; i++)
//         str += hash.charCodeAt(i).toString(16);
//     console.log(str);  
// }

// function toHexString(byteArray) {
//     return Array.from(byteArray, function(byte) {
//         return ('0' + (byte & 0xFF).toString(16)).slice(-2);
//     }).join('');
// }


module.exports = SecureSignallingClient;

