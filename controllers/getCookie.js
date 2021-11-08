const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const options = new chrome.Options()

options.addArguments('--headless')
options.addArguments('--disable-dev-shm-usage')
options.addArguments('--no-sandbox')

const username = 'nasibavalieva.2000@gmail.com'
const password = 'Newpassword888!'

async function getCookie() {
    let driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();
    driver.manage().window().maximize()
    let string = ''
    try{
        var session = await driver.getSession();
        session_id = session.id_;
        console.log('Getting cookie')


        let loginContainer = By.name('loginForm');
        let submit = By.css('.button');
        let inpUsername = By.name("username")
        let inpPassword = By.name("password")

        await driver.get('https://kaspi.kz/merchantcabinet/login'); 

        await driver.wait(until.elementLocated(loginContainer), 3000);
        // console.log('Login screen loaded.')
        
        await driver.findElement(inpUsername).sendKeys(username); 
        // console.log('Username is in input')
        await driver.findElement(inpPassword).sendKeys(password); 
        // console.log('Password is in input')

        await driver.findElement(submit).click();
        // console.log('Authorized merchant cabinet')
        const cookies = await driver.manage().getCookies()
        
        for(c of cookies){
            if(c.name!=='__ar_v4')
            string +=c.name+'='+c.value+';'
        }
    }
    catch(err){
        fs.appendFile('error.txt', new Date()+' ERROR LINE IN getCookie '+err+"\n", function (err) {if (err) throw err;});
    }
    finally{
        await driver.close(); 
        await driver.quit(); 
        console.log('Closed authorization browser')
    }
    return string
};

module.exports = {
    getCookie
}