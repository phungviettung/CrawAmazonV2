const XLSX = require('xlsx')
const puppeteer = require('puppeteer')

let dir = __dirname + '/Public/Import/jaaLifeSyle/test.xlsx'
const workbook = XLSX.readFile(dir)
const sheetNameList = workbook.SheetNames
const dataFromWorkbook = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]])
console.log(dataFromWorkbook)
const fillData = async function(info,browser){
    const page = await browser.newPage();
    page.setViewport({width: 1280, height:720});
    await page.goto('https://secure.jaalifestyle.com/ref/tungpv', { waitUntil: 'networkidle2', timeout: 0 })
    await page.evaluate((info)=>{
        document.getElementById('full_name').value = info.fullname
        document.getElementById('username').value = info.usename
        document.getElementById('email').value = info.mail
        document.getElementById('email_confirmation').value = info.cfmail
        document.getElementById('country').value = 237
        document.getElementById('phone').value = '0329015759'
        document.getElementById('dob').value = info.birthday
        document.getElementById('password').value = info.password
        document.getElementById('confirm_password').value = info.cfpassword
        document.getElementById('terms').checked=true
        document.getElementById('privacy').checked=true
        document.getElementById('signup').submit()
    }, info)
    await page.waitFor(12000);
    await page.close()
}

const execute = async(info)=>{
    const browser = await puppeteer.launch({ headless: false});
    for (let index = 0; index < dataFromWorkbook.length; index++) {
    let temp = dataFromWorkbook[index]
    await fillData(temp, browser).then(()=>{
        console.log('xong thang '+ index + 'la: '+temp.usename)
    }).catch(()=>{
        console.log('!!error thang '+ index + 'la: '+temp.usename)
    })
}
    await browser.close()
}

execute().then(()=>{
    console.log('xong nha!!!')
})
