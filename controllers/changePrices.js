const {Builder, By} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const axios = require('axios')
var fs = require('fs');
const {KaspiBot} = require('../telegram/index')
const extra = require('telegraf/extra')
const markup = extra.HTML()
const BotUser = require("../models/botUser");
const PRODUCT = require("../models/product");

const options = new chrome.Options()
options.addArguments('--headless')
options.addArguments('--disable-dev-shm-usage')
options.addArguments('--no-sandbox')


async function getProductOffers(links,products,cookie,excelValues,changing) {
    fs.appendFile('error.txt',  new Date()+ " In getProductOffers\n", function (err) {if (err) throw err;});
    let driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();
    // driver.manage().window().maximize()

    const users = await BotUser.find({})
    let changed_products_count = 0;
    let not_changed_products_count = 0;
    let first_place_count = 0;
    let demping_zero = 0;
    
    try{
        for(const l of links){
            try{
                console.log(new Date()+' '+l.link) 
                
                await driver.get(l.link);
                await driver.manage().setTimeouts( { implicit: 10000, pageLoad: 10000, script: 10000 } )
                await driver.sleep(1500)
                // const smallest_price = await driver.findElement(By.css('.item__price-once')).getAttribute("innerHTML")
                // const minimum_price_on_top = smallest_price.split('₸')[0].replace(' ','')
                const minimum_price_on_top = 10000000

                const product_name = l.product_name;
                const {letostore_price,product_info} = await getMerchantsPrices(l.link)

                const minimum_price = minimum_price_on_top<product_info[0].unitSalePrice ? minimum_price_on_top : product_info[0].unitSalePrice

                let product_from_excel =  excelValues.find(obj => obj.name === product_name)
                //только если продукт есть в excelValues то менять цену
                if(product_from_excel && letostore_price) {
                    if(product_from_excel.isChangeble){
                        let new_price,is_bigger,comment
                        // console.log('product in excel and isChangeble')
                        let sebest = product_from_excel.price
                        const sku = product_from_excel.sku
                        // let marzha = (sebest>50000) ? Math.ceil(sebest * 0.1) : Math.ceil(sebest * 0.15)
                        let marzha = 0
                        

                        //проверям меньше ли наша цена чем допустимая и меняем ее на допустимую+10%/15%
                        if(letostore_price<sebest+marzha){
                            new_price = sebest + marzha;
                            is_bigger = true;
                            comment = '❗️У этого товара цена была меньше себестоимости и я увеличил его цену.❗️❗️❗️';
                            // comment = '❗️У этого товара маржа была меньше нужной и я увеличил его цену.<b> Найдите поставщика подешевле </b>❗️❗️❗️';
                        }
                        //проверям больше ли маржа чем допустимая 
                        else{
                            //если мы не на первом месте
                            if(product_info[0].name!=='Letostore-kz' && minimum_price <= letostore_price){
                                let minimum_minus_one = (parseInt(minimum_price)-1)
                                //если допустимая цена+маржа меньше чем минимальная минус один
                                if(minimum_minus_one > sebest+marzha){
                                    new_price = minimum_minus_one; 
                                    is_bigger = false
                                    comment = 'Спустил цену на один тенге'
                                }
                                //проверяем второе место
                                else if(product_info[1] && product_info[1].name!=='Letostore-kz' && product_info[1].unitSalePrice <= letostore_price){
                                    minimum_minus_one = (parseInt(product_info[1].unitSalePrice)-1)
                                    //если допустимая цена+маржа меньше чем минимальная минус один
                                    if(minimum_minus_one > sebest+marzha){
                                        new_price = minimum_minus_one; 
                                        is_bigger = false
                                        comment = 'Спустил цену на один тенге и мы встали на второе место'
                                    }
                                    //проверяем третье место
                                    else if(product_info[2] && product_info[2].name!=='Letostore-kz' && product_info[2].unitSalePrice <= letostore_price){
                                        minimum_minus_one = (parseInt(product_info[2].unitSalePrice)-1)
                                        //если допустимая цена+маржа меньше чем минимальная минус один
                                        if(minimum_minus_one > sebest+marzha){
                                            new_price = minimum_minus_one; 
                                            is_bigger = false
                                            comment = 'Спустил цену на один тенге и мы встали на третье место'
                                        }
                                        //проверяем 4 место
                                        else if(product_info[3] && product_info[3].name!=='Letostore-kz' && product_info[3].unitSalePrice <= letostore_price){
                                            minimum_minus_one = (parseInt(product_info[3].unitSalePrice)-1)
                                            //если допустимая цена+маржа меньше чем минимальная минус один
                                            if(minimum_minus_one > sebest+marzha){
                                                new_price = minimum_minus_one; 
                                                is_bigger = false
                                                comment = 'Спустил цену на один тенге и мы встали на четвертое место'
                                            }
                                        }
                                    }
                                }
                                // else{
                                //     console.log(new Date()+" На первом месте чел с ценой ниже которой я не могу поставить. Надо найти другого поставщика.");
                                //     not_changed_products_count = not_changed_products_count+1;
                                //     users.forEach((user)=>{
                                //         KaspiBot.telegram.sendMessage(user.chat_id,
                                //             '❗️❗️❗<b>Маржа не проходит</b> \
                                //             \n<b>Название товара:</b> <i>'+product_name+'</i>\
                                //             \n<b>Цена с маржой: </b> <i>'+(sebest+marzha)+' тг</i>\
                                //             \n<b>Комментарий: </b>У этого товара маржа не проходит, не могу поставить его на первое место, найдите нового поставщика \
                                //             \n<b>Ссылка на продукт: </b> '+l.link
                                //             ,
                                //         markup)
                                //     })
                                // }
                            }

                            //если мы на первом месте, чтобы увеличивать цену подстраиваясь под второе место 
                            else{
                                console.log(new Date()+" Мы на первом месте");
                                first_place_count = first_place_count+1
                                //если есть второе место и их цена минус один больше чем наша, подстраиваться под него 
                                if(product_info[1]){
                                    if(parseInt(product_info[1].unitSalePrice)-1>letostore_price){
                                        new_price = parseInt(product_info[1].unitSalePrice-1)
                                        is_bigger = true;
                                        comment = 'Поднял цену, чтобы подстроиться под второе место';
                                        
                                    }
                                }
                                //если мы одни продаем этот товар то увеличивать маржу на 30%
                                else if(!product_info[1] && letostore_price < Math.ceil(sebest+(sebest * 0.3))){
                                    new_price = Math.ceil(sebest+(sebest * 0.3));
                                    is_bigger = true;
                                    comment = 'Только мы продаем этот товар, я увеличил маржу на 30%';
                                    
                                }
                            }
                        }

                        if(new_price!==undefined){ 
                            const found_product = products.find((obj)=>obj.masterProduct.name===product_name)
                            let product_to_change = await getProductToChange(sku,product_name,found_product,new_price)    
                            const hasChanged = await postToChangePrice(cookie,product_to_change)

                            // let product = await PRODUCT.findOne({ sku: sku });

                            if(hasChanged){
                                const emoji = is_bigger ? '⬆' : '⬇';
                                const top5String = await getTop5(product_info,new_price)
                                // console.log(new_price+" "+emoji); 
                                // console.log(top5String)
                                console.log(comment+"\n")
                                
                                //update in db
                                const filter = { sku: sku };
                                const update = {price : new_price}
                                await PRODUCT.updateOne(filter, update, {
                                    new: true,
                                });

                                users.forEach((user)=>{
                                    KaspiBot.telegram.sendMessage(user.chat_id,
                                        '<b>Название товара:</b> <i>'+product_name+'</i>\
                                        \n<b>Самая низкая цена была:</b> <i>'+formatter.format(parseInt(minimum_price),100000).replace(/,/g, " ") +' ₸</i>\
                                        \n<b>Самая низкая цена стала:</b> <i>'+formatter.format(new_price,100000).replace(/,/g, " ") +' ₸ </i>'+emoji+'\
                                        \n<b>Наша допустимая цена:</b> <i>'+formatter.format(sebest+marzha,100000).replace(/,/g, " ") +' ₸ </i>\
                                        \n<b>Ссылка на продукт: </b>'+l.link+'\
                                        \n<b>Топ 5:</b>\n'+top5String+'\
                                        \n<b>Комментарий:</b>\n'+comment
                                        ,
                                    markup)
                                })
                                changed_products_count = changed_products_count+1; 
                            }
                            

                        }
                    }
                    // else{
                    //     console.log('product in excel and not isChangeble')
                    //     demping_zero = demping_zero+1;
                    // }
                }

                await driver.sleep(1000)
            }
            catch(err){
                console.log(err)
                fs.appendFile('error.txt', new Date()+' ERROR LINE 161 '+err +"\n", function (err) {if (err) throw err;});
                continue
            }
        
        }
    }

    finally
    {
        await driver.close();
        await driver.quit();
        console.log('Quitted main browser')
        // console.log('Количество измененных товаров: '+changed_products_count)
        // console.log('Количество товаров, где мы на первом месте: '+ first_place_count)
        // console.log('Количество изменяемых товаров : '+ changing)
        // console.log('Количество не тронутых товаров по причине demping 0: '+ demping_zero)
        // console.log('Количество не тронутых товаров по причине маленькой маржы: '+ not_changed_products_count)


        //in mess tg
        // \n<b>Количество не тронутых товаров по причине маленькой маржы:</b> <i>'+not_changed_products_count+'</i>\

        users.forEach((user)=>{
            KaspiBot.telegram.sendMessage(user.chat_id,
                '<b>Количество измененных товаров:</b> <i>'+changed_products_count+'</i>\
                \n<b>Количество изменяемых товаров:</b> <i>'+changing+'</i>\
                \n<b>Количество товаров, где мы на первом месте:</b> <i>'+ first_place_count+'</i>'
                ,
            markup)
        })
        
        fs.appendFile('error.txt', new Date()+' Quitted main browser'+"\n", function (err) {if (err) throw err;});
    }
}

module.exports = {
    getProductOffers
}

function compare(a, b) {
    const priceA = a.unitSalePrice;
    const priceB = b.unitSalePrice;
  
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

async function getMerchantsPrices(link){
    return axios.get(link+'offers/?c=750000000&limit=50&page=0&sort=asc', {
        headers: {'Cookie': 'ticket=TGT-be6b8c9e-1aa3-4a37-b7bc-4111837b7f61'}
    })
    .then(response=>{
        letostore = response.data.data.find(({ name }) => name === 'Letostore-kz')
        if(letostore){
            // fs.appendFile('file.txt',new Date()+" Получил данные\n", function (err) {if (err) throw err;});                                      
            letostore_price = letostore.unitSalePrice
            product_info = response.data.data
            return {letostore_price,product_info}
        }
    })
    .catch(err=>{
        fs.appendFile('error.txt', new Date()+" "+link+' ERROR LINE 232 '+err+"\n", function (err) {if (err) throw err;});
    })
}

async function getProductToChange(sku,product_name,found_product,new_price){
    let cityData = []
    for(city of found_product.cityInfo){
        let new_city = city
        new_city.priceRow.price = new_price
        cityData.push(new_city)
    }
    let product_to_change = {
        'productSku':sku,
        'productName':product_name,
        'productBrand':found_product.brand,
        'cityData':cityData,
        'force':false,
        'new':false
    }
    return product_to_change
}

async function postToChangePrice(cookie,product_to_change){
    return axios.post('https://kaspi.kz/merchantcabinet/api/offer/save',product_to_change, {
        headers: {'Cookie': cookie}
    })
    .then(response=>{
        if(response.data.status==='SUCCESS'){
            console.log(new Date()+" Price changed successfully!")
            fs.appendFile('error.txt',new Date()+" "+ product_to_change.productName + ' Price changed successfully!', function (err) {if (err) throw err;});      
            return true
        }else{
            console.log(new Date()+' Could not change price!')
            fs.appendFile('error.txt',new Date()+' Could not change price! '+response+ "\n", function (err) {if (err) throw err;});
            return false
        }
    })
    .catch(err=>{
        fs.appendFile('error.txt', new Date()+' ERROR LINE 270 '+err+"\n", function (err) {if (err) throw err;});
        return false
    })    
}

function getTop5(product_info,new_price){
    const ind=product_info.findIndex((obj => obj.name === 'Letostore-kz'));
    product_info[ind].unitSalePrice = new_price
    product_info = product_info.sort(compare);

    //top 5 stores 
    const top5 = product_info.length>5 ? product_info.slice(0,5) : product_info
    //new_price became bigger or smaller

    var top5String = ''
    top5.forEach((top,index)=>{
        top5String+='<b>'+(index+1)+') </b><i>'+top.name+': '+top.unitSalePrice+' ₸</i>\n'
    })
    return top5String
}