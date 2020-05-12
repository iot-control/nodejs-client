
const secureSignallingClient = require('./SecureSignallingClient.js');

const options = {
    hmacKey: require('./password.js'),
    //hmacKey: 'secretpassword',
    hashByteLength: 32,
    randDataLength: 100,
    port: 777,
    ip: '192.168.0.6',

    onConnect: () => {
        console.log('Connected');
    }
}

const cmds = {
    getGateState:{
        cmd: 0,
        responses: [0x00, 0x01, 0x02] /* 0: Closed  1: Open  2: Middle */
    },
    switchGate: {
        cmd: 1,
        responses: [0x00] /* 0: Cmd received */
    },
    switchLight: {
        cmd: 2,
        responses: [0x00, 0x01] /* 0: now closed  1: now Open */
    }
};


// createOTP: {
//     cmd: 0,
//     responses: [0x00, 0x01] /* 0: Error  1: Created */
// },
// listOTPs: {
//     cmd: 0,
//     //responses: [0x00, 0x01, 0x02, 0x03] /* 0: 1  1: Created */
// },
// deleteOTPs: {
//     cmd: 0,
//     responses: [0x00, 0x01] /* 0: No OTPs to delete  1: Deleted */
// }



/*
    0-2 Exec functions
    3-5 CREATE OTP
    6-8 LIST OTPs
    9-11 DELETE OTPs
*/

secureSignallingClient(options, cmds.getGateState)
    .then(res => {
        switch(res){
            case 0:
                console.log('GATE IS CLOSED');
                break;
            case 1:
                console.log('GATE IS OPEN');
                break;
            case 2:
                console.log('GATE IS OPENING/CLOSING');
                break;
            default:
                console.log('UNKNOWN RESPONSE')
        }
        console.log(res);
    })
    .catch(err => {
        console.log('Catched Error ->');
        console.log(err);
    });

// setInterval(() => {
//     secureSignallingClient(options, cmds.switchGate);
// }, 320);

setTimeout(()=>{},3500);