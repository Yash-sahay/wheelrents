var firebase = require("firebase-admin");


const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Define JSON object with environment variables
const jsonData = {
  "type": process.env.TYPE,
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
  "universe_domain": process.env.UNIVERSE_DOMAIN
};


firebase.initializeApp({
    credential: firebase.credential.cert(JSON.parse(JSON.stringify(jsonData)))
});


const sendNotify = ({body, token, title, data}) => {

    const payload = {
        notification: {
            body: body || "N/a",
            title: title, 
        }
    };

    firebase.messaging().send({
        ...payload,
        token: token,
        data: data || {}
    })
}


module.exports = { firebase, sendNotify }
