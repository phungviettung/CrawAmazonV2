const XLSX = require('xlsx')
const puppeteer = require('puppeteer')
var shell = require('shelljs');

let dir = __dirname + '/Public/Import/email/info_finish.xlsx'
const workbook = XLSX.readFile(dir)
const sheetNameList = workbook.SheetNames
const dataFromWorkbook = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]])
// console.log(dataFromWorkbook)
const fillData = async function (info, browser) {
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 720 });
    await page.goto('https://secure.jaalifestyle.com/ref/tungpv', { waitUntil: 'networkidle2', timeout: 0 })
    await page.evaluate((info) => {
        document.getElementById('full_name').value = info.fullname
        document.getElementById('username').value = info.usename
        document.getElementById('email').value = info.mail
        document.getElementById('email_confirmation').value = info.cfmail
        document.getElementById('country').value = 237
        document.getElementById('phone').value = info.phone
        document.getElementById('dob').value = info.birthday
        document.getElementById('password').value = info.password
        document.getElementById('confirm_password').value = info.cfpassword
        document.getElementById('terms').checked = true
        document.getElementById('privacy').checked = true
        document.getElementById('signup').submit()
    }, info)
    await page.waitFor(12000);
    await page.close()
}

const execute = async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--proxy-server=socks5://127.0.0.1:60000', '--no-sandbox'] });
    for (let index = 0; index < dataFromWorkbook.length; index++) {
        let temp = dataFromWorkbook[index]
        await fillData(temp, browser).then(async () => {
            await shell.exec('systemctl restart tor');
            await shell.exec('curl --socks5 localhost:9050 --socks5-hostname localhost:9050 -s https://api.ipify.org/');
            console.log('xong thang ' + index + 'la: ' + temp.usename)
        }).catch(() => {
            console.log('!!error thang ' + index + 'la: ' + temp.usename)
        })
    }
    await browser.close()
}

execute().then(() => {
    console.log('xong nha!!!')
})


