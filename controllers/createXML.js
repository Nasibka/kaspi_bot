require("../db")();
const {doc} = require('../google_services/index')
var xmlbuilder = require('xmlbuilder');
var fs = require('fs');

const PRODUCT = require("../models/product");
const {getAllProducts} = require('./getAllProducts')
const {getCookie} = require('./getCookie')
const {getProductsFromExcel,changeRow} = require('../google_services/getExcel')

createXML()
async function createXML(){
    // console.log('creating XML')
    const excelValues = await getProductsFromExcel();
    console.log(excelValues.length)

    const c = await getCookie()
    const products = await getAllProducts(c)
    let array = []

    for(const el of excelValues){
        // console.log(el,22)
        const product = await getFromDatabase(el.sku,products,excelValues)
        // console.log(product,24)
        const product_from_excel = excelValues.find(obj => obj.sku === el.sku)
        const availability = product_from_excel.available ==='да'? 'yes':'no'
        const price = product_from_excel.isChangable ? product.price : product_from_excel.price
        array.push(
            {  
                '@sku': product_from_excel.sku,
                model: product_from_excel.name,
                brand: product_from_excel.brand,
                availabilities:{
                    availability :[
                        {'@available': availability ,'@storeId':'PP1'},
                    ]
                },
                price: price
            }, 
        )
    }
    // availability :[
    //     {'@available': availability ,'@storeId':'PP1', '@preOrder':product_from_excel.preorder},
    // ]
    var root = xmlbuilder.create('kaspi_catalog',
        {version: '1.0', encoding: 'UTF-8'}
    );
    root.att('date', "string")
    root.att('xmlns', "kaspiShopping")
    root.att('xmlns:xsi', "http://www.w3.org/2001/XMLSchema-instance")
    root.att('xsi:schemaLocation', "kaspiShopping http://kaspi.kz/kaspishopping.xsd")

    var obj = {
        company: 'Letostore-kz',
        merchantid: "Letostorekz",
        offers:{
            offer: array
        }
    };
    root.ele(obj);
    // console.log(root.end({ pretty: true}));

    //add point
    fs.writeFile(
        "../prices_for_kaspi.xml", 
        root.end({ pretty: true}), 
        function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log("The file was saved!");
            } 
        }
    ); 

    // await fillPriceInExcel()
}

async function getFromDatabase(sku,products,excelValues){
    let product = await PRODUCT.findOne({ sku: sku });
    // console.log(product,77)
   
    if(!product){
        console.log(sku)
        const product_from_cabinet = products.find(obj => obj.sku === sku)
        const product_from_excel = excelValues.find(obj => obj.sku === sku)
        const availability = product_from_excel.available ==='да'? 'yes':'no'
        let newProduct
        console.log(product_from_excel.price)

        if(product_from_cabinet){
            newProduct = {
                sku: sku,
                product_name: product_from_cabinet.name,
                available: availability,
                price:product_from_cabinet.priceMin,
                brand:product_from_cabinet.brand
            }
        }
        else{
            newProduct = {
                sku: sku,
                product_name: product_from_excel.name,
                available: availability,
                price:product_from_excel.price,
                brand:product_from_excel.brand
            }
        }

        product = new PRODUCT(newProduct);
        product.save((err, saved) => {
            if(err) console.log(err, ' ,error in saving product');
            if (saved) console.log(sku+' product saved');
        });
        return newProduct
        
    }
    return product
}
async function fillPriceInExcel(){
    const excelValues = await getProductsFromExcel();
    console.log(excelValues.length)

    await doc.loadInfo();
    const sheet = doc.sheetsById[463799138]
    const rows = await sheet.getRows()
    console.log('get rows')

    // for(const el of excelValues){
    for (let i =120 ;i<excelValues.length;i++){
        let product = await PRODUCT.findOne({ sku: excelValues[i].sku });
        await changeRow(product.sku,product.price,rows)
        await sleep(1000) 
    }
    console.log('changed sebestoimost (цена продажи)')
}
async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

module.exports = {
    createXML
}


 
// var root = builder.create('squares');
// root.com('f(x) = x^2');
// for(var i = 1; i <= 5; i++)
// {
//   var item = root.ele('data');
//   item.att('x', i);
//   item.att('y', i * i);
// }
 
// var xml2 = root.end({ pretty: true});
// console.log(xml2);