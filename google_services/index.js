const { GoogleSpreadsheet } = require('google-spreadsheet');

const keys = require('../config/keysGS')
const doc = new GoogleSpreadsheet('1_agep7clDCft8vgi_of-G2buupMfR9V--oOdfodQWQY');

async function connectGoogleSheet(){
    await doc.useServiceAccountAuth({
        client_email: keys.client_email,
        private_key: keys.private_key,
      });
}
connectGoogleSheet()

module.exports = {
    doc
};