const {doc} = require('./index')

async function getExcel(){ 
    let excelValues = []
    await doc.loadInfo(); 
    //cebestoimost'
    const sheet = doc.sheetsById[1825765023]
    //testoviy
    // const sheet = doc.sheetsById[463799138]
    const rows = await sheet.getRows()
    for(var i= 1;i<rows.length;i++){
        if(rows[i]['SKU'] && rows[i]['ДЕМПИНГ ЦЕН']){
            const name = rows[i]['Наименование товара']
            let price = rows[i]['С комиссией банка']
            const sku = rows[i]['SKU']
            const isChangable = rows[i]['ДЕМПИНГ ЦЕН']
            const available = rows[i]['Наличие']

            if(price!==undefined){
                price = price.replace(/\s/g, '')
                if(isChangable==='1'){
                    excelValues.push({'name':name,'price': parseInt(price),'sku':sku,'isChangeble':true,'available':available})
                    // console.log({'name':name,'price': parseInt(price),'sku':sku})
                }else{
                    excelValues.push({'name':name,'price': parseInt(price),'sku':sku,'isChangeble':false,'available':available})
                }
            }     
        }
    }
    return excelValues
}

async function getProductsFromExcel(){ 
    let excelValues = []
    await doc.loadInfo(); 
    const sheet = doc.sheetsById[1825765023]
    const rows = await sheet.getRows()
    for(var i = 0; i<rows.length;i++){
        if(rows[i]['SKU'] && rows[i]['ДЕМПИНГ ЦЕН']){
            const name = rows[i]['Наименование товара']
            let allow_price = rows[i]['С комиссией банка']
            let price = rows[i]['Цена продажи']
            const sku = rows[i]['SKU']
            let isChangable = rows[i]['ДЕМПИНГ ЦЕН']
            const available = rows[i]['Наличие']
            const brand = rows[i]['Бренд']
            const preorder = rows[i]['preorder']
            
            if(allow_price && price ){
                price = price.replace(/\s/g, '')
                allow_price = allow_price.replace(/\s/g, '')
                isChangable = isChangable == 1? true : false
                excelValues.push({'name':name,'allow_price':parseInt(allow_price),
                'price': parseInt(price),'sku':sku,'isChangable':isChangable,
                'available':available,'brand':brand, 'preorder':preorder})
            }     
        }
    }
    return excelValues
}

async function changeRow(sku,price,rows){
    for (let index = 0;index <= rows.length; index++) {
        if (rows[index]['SKU'] === sku) {
            const row = rows[index] 
            row['Цена продажи'] = price
            await row.save()
            console.log('changed')
            break;
        }
    }
}

module.exports = {
    getExcel,
    getProductsFromExcel,
    changeRow
};