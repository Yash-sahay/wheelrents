var firebase = require("firebase-admin");

var serviceAccount = require("./wheelrents-firebase-adminsdk-nrkil-9d6fa1175f.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount)
});


const sendNotify = ({body, token, title}) => {

    const payload = {
        notification: {
            body: body,
            title: title,
        }
    };

    firebase.messaging().send({
        ...payload,
        token: token,
    })
}


module.exports = { firebase, sendNotify }
