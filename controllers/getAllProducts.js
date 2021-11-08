const axios = require('axios')

async function getAllProducts(cookie){
    const headers = {
        'Cookie': cookie
    }
    const body = {
        "searchTerm":null,
        "offerStatus":null,
        "categoryCode":null,
        "cityId":null,
        "start":0,
        "count":1000
    }

    const products = await axios.post('https://kaspi.kz/merchantcabinet/api/offer',body, {
        headers: headers
    })
    .then(response=>{
        return response.data.offers
    })
    .catch(err=>{
        console.log(err)
    })
     
    return products
}

module.exports = {
    getAllProducts
}