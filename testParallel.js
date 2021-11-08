// import { exec } from "child_process"
require("./db")();
var fs = require('fs');

const {getCookie} = require('./controllers/getCookie')
const {getProductsList} = require('./controllers/getProductsList')
const {getExcel} = require('./google_services/getExcel')
const path = './file.txt'
const {getProductOffers} = require('./controllers/changePrices')

// kek()

async function kek(){
    if (fs.existsSync(path)) { 
        console.log('not working')
        fs.appendFile('error.txt', new Date()+" not working\n", function (err) {if (err) throw err;});
    }else{
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

            const TASKS = [ task1, task2, task3, task4, task5, task6 ]
            execute(TASKS,links)

            // await getProductOffers(links,products.products,c,excelValues,products.changing)
        }
        catch(err) {
            fs.appendFile('error.txt', new Date()+' ERROR LINE 55 '+err+"\n", function (err) {if (err) throw err;});
        }
        finally{
            console.log('Finished')
            fs.unlinkSync(path)
        }  
    }     

}

function task1 (array) {
    return Promise.resolve()
      .then(() => {
          console.log('first ')
          console.log(array)
      })
  }
  
function task2 (array) {
    return Promise.resolve()
        .then(() => {
            console.log('second ')
            console.log(array)
        })
}

function task3 (array) {
    return Promise.resolve()
        .then(() => {
            console.log('3 ')
            console.log(array)
        })
}

function task4 (array) {
    return Promise.resolve()
      .then(() => {
        console.log('4 ')
        console.log(array)
    })
}

function task5 (array) {
    return Promise.resolve()
        .then(() => {
            console.log('5 ')
            console.log(array)
        })
}

function task6 (array) {
    return Promise.resolve()
        .then(() => {
            console.log('6 ')
            console.log(array)
        })
}

const MAX_EXECUTION_TASKS = 2

function execute (tasks,array) {

  let completed = 0
  let running = 0
  let index = 0
  let slice = 0

  function run () {
    if (completed === tasks.length) {
      return console.log('All tasks have been completed')
    }

    while (running < MAX_EXECUTION_TASKS && index < tasks.length) {

        tasks[index++](array.slice(slice,slice+20)).then(() => {
            slice = slice+20
            running--, completed++
            run()
        })
        running++
    }
  }

  return run()
}


async function parallel(){
    const index = 3
    const start = new Date()

    console.log("starts main program " + start)

    let valueReturnedByOuterAPICall
    let innerAPICalls = []
    for (let i = 1; i <= index; i++) {
        console.log("outerAPICall_" + i + " starts : " + new Date())
        valueReturnedByOuterAPICall = await outerAPICall(i, i * 2, i);
        console.log("outerAPICall_" + i + " ends   : " + new Date())
        console.log("outerAPICall_" + i + " has sent " + valueReturnedByOuterAPICall)
        for (let j = 1; j <= index; j++) {
            if (j != i) {
                console.log("starts pushing innerAPICall_" + j + ": " + (new Date()))
                innerAPICalls.push(innerAPICall(j, valueReturnedByOuterAPICall))
                console.log("ends pushing innerAPICall_" + j + ": " + (new Date()))
            }
        }
    }

    console.log("end preparing innerAPICalls " + (new Date()))
    await Promise.all(innerAPICalls)
    console.log("ends " + (new Date()))
    var end = new Date() - start
    console.info('Execution time: %dms', end)
}
// parallel()

async function outerAPICall(index, intervalOuterAPICall, intervalInnerAPICall) {
    return new Promise(function(resolve, reject) {
        console.log("Func outerAPICall" + index + " will, after " + intervalOuterAPICall + "s, send : " + intervalInnerAPICall)
        // means after intervalOuterAPICall secs, intervalInnerAPICall will be resolved and returned, so it means the outerAPICall will return intervalInnerAPICall after intervalInnerAPICall secs
        setTimeout(resolve, intervalOuterAPICall * 1000, intervalInnerAPICall);
    });
}
async function innerAPICall(interval) {
    return new Promise(function(resolve, reject) {
        console.log("Func innerAPICall will, after " + interval + "s, send : " + interval)
        setTimeout(resolve, interval * 1000, interval * 1000 + " processed");
    });
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
            v_kabinete_net_v_tablice.push(item1.sku)

        }
    }
    console.log(v_kabinete_net_v_tablice,125)
    console.log(v_kabinete_net_v_tablice.length,126)
    // console.log(v_kabinete_ne_demping,127)
    console.log(v_kabinete_ne_demping.length,128)
    return v_kabinete_demping;
}
