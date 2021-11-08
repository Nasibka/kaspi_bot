require("./db")();
//uncomment
require("./controllers/cron");

var fs = require('fs');

const {getCookie} = require('./controllers/getCookie')
const {getProductsList} = require('./controllers/getProductsList')
const {getExcel} = require('./google_services/getExcel')
const {getProductOffers} = require('./controllers/changePrices')
const path = './file.txt'

//uncomment
if (fs.existsSync(path)) {
    fs.unlinkSync(path)
}

// kek()
async function kek(){
    // if (fs.existsSync(path)) { 
    //     console.log('not working')
    //     fs.appendFile('error.txt', new Date()+" not working\n", function (err) {if (err) throw err;});
    // }else{
        try { 
            console.log('working')
            fs.appendFile('error.txt', new Date()+" working\n", function (err) {if (err) throw err;});
            fs.appendFile(path, 'kek', function (err) {
                if (err) throw err;
                console.log('Saved!');
            });

            const c = await getCookie()
            const products = await getProductsList(c)
            console.log('Number of products( which is not processing right now ): '+products.products.length)
            fs.appendFile('error.txt', new Date()+' Number of products(which is not processing right now): '+products.products.length+"\n", function (err) {if (err) throw err;});
            const excelValues = await getExcel()
            console.log('Number of excelValues: '+excelValues.length)
            fs.appendFile('error.txt',  new Date()+' Number of excelValues: '+excelValues.length+"\n", function (err) {if (err) throw err;});
            const p = await operation(products.products,excelValues,true)
            console.log('Number of intersection products and excelValues: '+p.length)
            fs.appendFile('error.txt',  new Date()+' Number of intersection products and excelValues: '+p.length+"\n", function (err) {if (err) throw err;});
            
            let links = []
            p.forEach(element => {
                links.push({link:element.masterProduct.productUrl,product_name:element.masterProduct.name})
            });
            
            await getProductOffers(links,products.products,c,excelValues,products.changing)
        }
        catch(err) {
            fs.appendFile('error.txt', new Date()+' ERROR LINE 55 '+err+"\n", function (err) {if (err) throw err;});
        }
        finally{
            console.log('Finished')
            fs.unlinkSync(path)
        }  
}

function operation(list1, list2, isUnion) {
    var  v_kabinete_demping = [];
    var v_kabinete_net_v_tablice = [];
    var v_kabinete_ne_demping = []

    for (var i = 0; i < list1.length; i++) {
        var item1 = list1[i]
        var found = false
        for(var j = 0; j < list2.length && !found; j++) {
            if(item1.sku === list2[j].sku){
                if(list2[j].isChangeble){
                    found = true
                    v_kabinete_demping.push(item1);
                    break;
                }else{
                    found = true
                    v_kabinete_ne_demping.push(item1.masterProduct.name)
                }
            }
        }
        if(!found){
            v_kabinete_net_v_tablice.push(item1.masterProduct.name)
        }
    }
    console.log(v_kabinete_net_v_tablice,125)
    console.log(v_kabinete_net_v_tablice.length,126)
    // console.log(v_kabinete_ne_demping,127)
    console.log(v_kabinete_ne_demping.length,128)
    return v_kabinete_demping;
}

