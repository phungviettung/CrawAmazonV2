// var shell = require('shelljs');
// shell.exec('sudo systemctl restart tor');

const emailExistence = require('email-existence')
const fs = require('fs')
const XLSX = require('xlsx')

let dir = __dirname + '/Public/Import/email/info.xlsx'

async function takeMails() {
    let mails = []
    const workbook = XLSX.readFile(dir)
    const sheetNameList = workbook.SheetNames
    const dataFromWorkbook = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]])
    // console.log(dataFromWorkbook)
    for (let index = 0; index < dataFromWorkbook.length; index++) {
        mails.push(dataFromWorkbook[index].email)
    }
    return mails
}
// const mails = ['manhxyz.11@gmail.com', 'abc@gmail.com', 'tungxyz.11@gmail.com']

function checkMails(mails) {
    for (let index = 0; index < mails.length; index++) {
        if (mails[index] !== undefined) {
            console.log(mails[index])
            emailExistence.check(mails[index], function (error, response) {
                if (response == true) {
                    fs.appendFile('./Public/Result/ValidEmail/mail.txt', mails[index] + '\n', (error) => {
                        if (error) throw error
                        console.log('saved!')
                    })
                }
            });
        }else{
            continue
        }

    }
}

takeMails().then((mails) => {
    // console.log(mails)
    checkMails(mails)
})


