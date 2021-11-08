const axios = require('axios')

async function getProductsList(cookie){
    const headers = {
        // 'Cookie':'JSESSIONID='+cookie.value+';ks.ngs.m:'+cookie2.value
        'Cookie': cookie
    }
    const body = {
        "searchTerm":null,
        "offerStatus":"ACTIVE",
        "categoryCode":null,
        "cityId":null,
        "start":0,
        "count":1000
    }

    let kek;
    const products = await axios.post('https://kaspi.kz/merchantcabinet/api/offer',body, {
        headers: headers
    })
    .then(response=>{
        const array = response.data.offers.filter(function(product) {
            return product.nextGen === null;
        })
        kek = (response.data.offers.length - array.length)
        return array
    })
    .catch(err=>{
        console.log(err)
    })
     
    return {products:products,changing:kek}
}

module.exports = {
    getProductsList
}