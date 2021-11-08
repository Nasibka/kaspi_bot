const CronJob = require("cron").CronJob;
const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const axios = require('axios')
const {KaspiBot} = require('../telegram/index')
const extra = require('telegraf/extra')
const markup = extra.HTML()

const BotUser = require("../models/botUser");

const {getExcel} = require('../google_services/getExcel')
const options = new chrome.Options()

options.addArguments('--headless')
options.addArguments('--disable-dev-shm-usage')
options.addArguments('--no-sandbox')

let excelValues = []


async function getProductOffers(links,products,cookie) {
    let driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();
    driver.manage().window().maximize()
    excelValues = await getExcel()

    const users = await BotUser.find({})
    try{
        // await driver.executeScript('window.open("google.com");');
        for(const link of links){
            try{
                console.log(link)
                let change_value 
                let script = By.css('script[type="application/ld+json"]');
                let smallest_price = By.css('.item__price-once')
                
                await driver.get(link);
                await driver.sleep(2000)
                const scriptHTML = await driver.findElement(script).getAttribute("innerHTML")
                const obj = JSON.parse(scriptHTML)

                smallest_price = await driver.findElement(smallest_price).getAttribute("innerHTML")
                const minimum_price_on_top = smallest_price.split('₸')[0].replace(' ','')

                let product_info = obj.offers.offers;
                const product_name = obj.name;
            
                const letostore = product_info.find(({ name }) => name === 'Letostore-kz')
                const letostore_price = letostore.price.split('₸')[0].replace(' ','')
                const minimum_price_from_bottom = product_info[0].price.split(' ₸')[0].replace(' ','')

                const minimum_price = minimum_price_on_top<minimum_price_from_bottom ? minimum_price_on_top : minimum_price_from_bottom
                // console.log(minimum_price)

                //допустимая цена из экзеля
                let product_from_excel =  excelValues.find(obj => obj.name === product_name)

                //только если продукт есть в excelValues то менять цену
                if(product_from_excel){
                    // console.log('product in excel')
                    let allowable_price = product_from_excel.price
                    const sku = product_from_excel.sku
                    let marzha

                    if(allowable_price>50000){
                        //marzha is 10 percent
                        marzha = Math.ceil(allowable_price * 0.1)
                    }else{
                        //marzha is 15 percent
                        marzha = Math.ceil(allowable_price * 0.15)
                    }
                    

                    //проверям меньше ли наша цена чем допустимая и меняем ее на допустимую+10%/15%
                    if(letostore_price<allowable_price+marzha){
                        console.log('У этого товара маржа была меньше нужной')
                        // const zarabotok = letostore_price > 50000 ? 10000 : 5000
                        const new_price = allowable_price + marzha

                        const ind=product_info.findIndex((obj => obj.name === 'Letostore-kz'));
                        product_info[ind].price = formatter.format(new_price,100000).replace(/,/g, " ")  + ' ₸'
                        product_info = product_info.sort(compare);

                        //top 5 stores 
                        const top5 = product_info.length>5 ? product_info.slice(0,5) : product_info
                        //new_price became bigger or smaller
                        const is_bigger = true 
                        
                        change_value ={
                            'change':true,
                            'product_name':product_name,
                            'allowable_price':allowable_price,
                            'new_price':new_price,
                            'was_price':minimum_price,
                            'top5':top5,
                            'is_bigger':is_bigger,
                            'product_url':link,
                            'sku':sku,
                            'comment':'У этого товара маржа была меньше нужной и я увеличил его цену. Найдите поставщика подешевле'
                        }
                    }
                    //проверям больше ли маржа чем допустимая 
                    else{
                        //если мы не на первом месте
                        if(product_info[0].name!=='Letostore-kz'){
                            //если минимальная цена меньше чем наша
                            if (minimum_price <= letostore_price){ 
                                const minimum_minus_one = (parseInt(minimum_price)-1)

                                //если допустимая цена+маржа меньше чем минимальная минус один
                                if(minimum_minus_one > allowable_price+marzha){
                                    const new_price = minimum_minus_one        
                                    
                                    //sort again
                                    const ind=product_info.findIndex((obj => obj.name === 'Letostore-kz'));
                                    product_info[ind].price = formatter.format(new_price,100000).replace(/,/g, " ")  + ' ₸'
                                    product_info = product_info.sort(compare);

                                    //top 5 stores 
                                    const top5 = product_info.length>5 ? product_info.slice(0,5) : product_info
                                    //new_price became bigger or smaller
                                    const is_bigger = new_price>letostore_price ? true : false

                                    console.log('need to change price')
                                    change_value= {
                                        'change':true,
                                        'product_name':product_name,
                                        'allowable_price':allowable_price,
                                        'new_price':new_price,
                                        'was_price':minimum_price,
                                        'top5':top5,
                                        'is_bigger':is_bigger,
                                        'product_url':link,
                                        'sku':sku
                                    }
                                }
                                else{
                                    users.forEach((user)=>{
                                        KaspiBot.telegram.sendMessage(user.chat_id,
                                            '❗️У этого товара маржа не проходит, не могу поставить его на первое место, найдите нового поставщика! \
                                            \n<b>Название товара:</b> <i>'+change_value.product_name+'</i>\
                                            \n<b>Ссылка на продукт: </b>'+change_value.product_url
                                            ,
                                        markup)
                                    })
                                    console.log('цена+маржа больше чем минимальная минус один')
                                }
                            }
                        }
                        //check second store from the top in order to increase our price till second_store's price - 1
                        //если мы на первом месте, чтобы увеличивать цену подстраиваясь под второе место 
                        else{
                            //если есть второе место и их цена минус один больше чем наша
                            if(allowable_price && product_info[1] && parseInt(product_info[1].price.split('₸')[0].replace(' ',''))-1>letostore_price){
                                const new_price = parseInt(product_info[1].price.split(' ₸')[0].replace(' ','')-1)
                                
                                const ind = product_info.findIndex((obj => obj.name === 'Letostore-kz'));
                                product_info[ind].price = formatter.format(new_price,100000).replace(/,/g, " ") + ' ₸'
                                
                                //top 5 stores 
                                const top5 = product_info.length>5 ? product_info.slice(0,5) : product_info
                                //new_price became bigger or smaller
                                const is_bigger = true 

                                console.log('need to change price')
                                change_value = {
                                    'change':true,
                                    'product_name':product_name,
                                    'allowable_price':allowable_price,
                                    'new_price':new_price,
                                    'was_price':minimum_price,
                                    'top5':top5,
                                    'is_bigger':is_bigger,
                                    'product_url':link,
                                    'sku':sku
                                }
                            }
                            //если мы одни продаем этот товар то увеличивать маржу на 30%
                            else if(!product_info[1] && letostore_price < allowable_price * 0.3){

                                const new_price = Math.ceil(allowable_price * 0.3)
                                
                                const ind = product_info.findIndex((obj => obj.name === 'Letostore-kz'));
                                product_info[ind].price = formatter.format(new_price,100000).replace(/,/g, " ") + ' ₸'
                                
                                //top 5 stores 
                                const top5 = product_info.length>5 ? product_info.slice(0,5) : product_info
                                //new_price became bigger or smaller
                                const is_bigger = true 

                                console.log('need to change price')
                                change_value = {
                                    'change':true,
                                    'product_name':product_name,
                                    'allowable_price':allowable_price,
                                    'new_price':new_price,
                                    'was_price':minimum_price,
                                    'top5':top5,
                                    'is_bigger':is_bigger,
                                    'product_url':link,
                                    'sku':sku,
                                    'comment':'Только мы продаем этот товар,я увеличил маржу на 30%'
                                }
                            }
                        }
                    }
                }

                if(change_value){
                    // console.log(change_value,140)
                    const found_product = products.find((obj)=>obj.masterProduct.name===change_value.product_name)

                    let cityData = []
                    for(city of found_product.cityInfo){
                        let new_city = city
                        new_city.priceRow.price = change_value.new_price
                        cityData.push(new_city)
                    }
                    let product_to_change = {
                        'productSku':change_value.sku,
                        'productName':change_value.product_name,
                        'productBrand':found_product.brand,
                        'cityData':cityData,
                        'force':false,
                        'new':false
                    }

                    // const headers = {
                    //     'Cookie': cookie
                    // }
                    // axios.post('https://kaspi.kz/merchantcabinet/api/offer/save',product_to_change, {
                    //     headers: headers
                    // })
                    // .then(response=>{
                    //     console.log(response.data)
                    //     console.log(link)
                    //     console.log('Price changed successfully!')
                    // })
                    // .catch(err=>{
                    //     console.log(err.data,172)
                    // })

                    
                    var top5String = ''
                    change_value.top5.forEach((top,index)=>{
                        top5String+='<b>'+(index+1)+')</b><i>'+top.name+': '+top.price+'</i>\n'
                    })
                    let emoji
                    if(change_value.is_bigger===true){
                        emoji = '⬆'
                    }else{
                        emoji ='⬇'
                    }
                    
                    if(change_value.comment){
                        console.log(change_value,245)

                        users.forEach((user)=>{
                            KaspiBot.telegram.sendMessage(user.chat_id,
                                '<b>Название товара:</b> <i>'+change_value.product_name+'</i>\
                                \n<b>Самая низкая цена была:</b> <i>'+formatter.format(parseInt(change_value.was_price),100000).replace(/,/g, " ") +' ₸</i>\
                                \n<b>Самая низкая цена стала:</b> <i>'+formatter.format(change_value.new_price,100000).replace(/,/g, " ") +' ₸ </i>'+emoji+'\
                                \n<b>Наша допустимая цена:</b> <i>'+formatter.format(change_value.allowable_price,100000).replace(/,/g, " ") +' ₸ </i>\
                                \n<b>Ссылка на продукт: </b>'+change_value.product_url+'\
                                \n<b>Топ 5:</b>\n'+top5String+'\
                                \n<b>Комментарий:</b>\n'+change_value.comment
                                ,
                            markup)
                        })
                    }
                    else{
                        users.forEach((user)=>{
                            KaspiBot.telegram.sendMessage(user.chat_id,
                                '<b>Название товара:</b> <i>'+change_value.product_name+'</i>\
                                \n<b>Самая низкая цена была:</b> <i>'+formatter.format(parseInt(change_value.was_price),100000).replace(/,/g, " ") +' ₸</i>\
                                \n<b>Самая низкая цена стала:</b> <i>'+formatter.format(change_value.new_price,100000).replace(/,/g, " ") +' ₸ </i>'+emoji+'\
                                \n<b>Наша допустимая цена:</b> <i>'+formatter.format(change_value.allowable_price,100000).replace(/,/g, " ") +' ₸ </i>\
                                \n<b>Ссылка на продукт: </b>'+change_value.product_url+'\
                                \n<b>Топ 5:</b>\n'+top5String
                                ,
                            markup)
                        })
                    }
                
                }
                await driver.sleep(3000)
                
            }catch(err){
                console.log(err)
                continue
            }
        }
    }

    finally
    {
        await driver.close();
        await driver.quit();
        console.log('Quitted main browser')
    }
}

module.exports = {
    getProductOffers
}

//sort function for prices 
function compare(a, b) {
    const priceA = a.price.split('₸')[0].replace(' ','');
    const priceB = b.price.split('₸')[0].replace(' ','');
  
    let comparison = 0;
    if (priceA > priceB) {
      comparison = 1;
    } else if (priceA < priceB) {
      comparison = -1;
    }
    return comparison;
}

const formatter = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
});