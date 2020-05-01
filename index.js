const express = require('express');
const XLSX = require('xlsx')
const fileUpload = require('express-fileupload')
const puppeteer = require('puppeteer')

let app = express();
app.use(express.static('Public'));
app.use(fileUpload())

app.set('view engine', 'ejs');
app.set('views', './View');
port = 3000

var server = app.listen(port);
server.timeout = 259200000

let step = 0
let totalTime
const results = []
const isbn = []
let linkFileExport

app.get('/', function (req, resp) {
    resp.render('home')
});
app.post('/', function (req, resp) {
    resp.end('home')
});

app.post('/upload', function (req, res) {
    //call one api
    const takeLinkAndImg = async function (isbn, browser) {
        const page = await browser.newPage();
        page.setViewport({ width: 1280, height: 720 });
        await page.goto('https://www.amazon.com/s?k=' + isbn + '&ref=nb_sb_noss', { waitUntil: 'networkidle2', timeout: 0 });

        const take1 = await page.evaluate(() => {
            //take img
            let imgs = document.getElementsByClassName("s-image");
            let linkImg
            imgs = [...imgs];
            if (imgs[0]) {
                linkImg = imgs[0].attributes[0].textContent.trim();
            } else {
                linkImg = " "
            }
            //take link 
            let linkProduct = document.getElementsByClassName('a-link-normal a-text-normal');
            let link
            linkProduct = [...linkProduct];
            if (linkProduct[0]) {
                link = linkProduct[0].attributes[1].textContent;
            } else {
                link = " "
            }
            return { linkImg, link }
        })

        await page.close()


        if (take1.link !== " ") {
            const page2 = await browser.newPage();
            await page2.goto('https://www.amazon.com' + take1.link, { waitUntil: 'networkidle2', timeout: 0 });
            const take2 = await page2.evaluate(() => {
                //take title 
                let title = document.getElementById("productTitle");
                let contentTitle
                if (title) {
                    contentTitle = title.textContent.trim()
                } else {
                    contentTitle = " "
                }
                //take edition
                let subTitle = document.getElementById("productSubtitle");
                let contentSubtitle;
                if (subTitle) {
                    contentSubtitle = subTitle.textContent.trim()
                } else {
                    contentSubtitle = " "
                }
                //take price
                let price = document.querySelectorAll("span.a-size-medium.a-color-price");
                let contentPrice
                if (price[0]) {
                    contentPrice = price[0].innerText
                } else {
                    contentPrice = " "
                }
                // take description
                let description = document.getElementById("bookDesc_iframe");
                if (description) {
                    contentDes = description.contentWindow.document.getElementById("iframeContent").textContent;
                } else {
                    contentDes = " "
                }
                //take author
                let author = document.getElementsByClassName("a-link-normal contributorNameID");
                if (author[0]) {
                    contentAuthor = author[0].text;
                } else {
                    contentAuthor = " "
                }
                return {
                    contentTitle: contentTitle,
                    contentSubtitle: contentSubtitle,
                    contentPrice: contentPrice,
                    contentDes: contentDes,
                    contentAuthor: contentAuthor
                }
            }).then((response) => {
                results.push({
                    isbn: isbn,
                    contentTitle: response.contentTitle,
                    contentSubtitle: response.contentSubtitle,
                    contentPrice: response.contentPrice,
                    contentDes: response.contentDes,
                    contentAuthor: response.contentAuthor,
                    imgProduct: take1.linkImg
                })
                step++
                console.log('đã xử lí xong ' + step + ' isbn')
            })
            await page2.close()
        } else {
            results.push({
                isbn: isbn,
                contentTitle: ' ',
                contentSubtitle: ' ',
                contentPrice: ' ',
                contentDes: ' ',
                contentAuthor: ' ',
                imgProduct: ' '
            })
            step++
            console.log('đã xử lí xong ' + step + ' isbn')
        }
    }

    //call many api
    const excute = async (isbn) => {
        const browser = await puppeteer.launch({ headless: true, ignoreDefaultArgs: ['--disable-extensions'] });
        let start = new Date()
        for (let index = 0; index < isbn.length; index++) {
            await takeLinkAndImg(isbn[index], browser)
        }
        await browser.close()
        let end = new Date()
        totalTime = (end.getTime()-start.getTime())/60000
        console.log("Tổng thời gian thực hiện " + totalTime + 'minutes' )
    }

    //write file 
    const writeFile = (results, filename) => {
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(results)
        XLSX.utils.book_append_sheet(wb, ws, 'banchan')
        filename = filename.substring(
            0,
            filename.lastIndexOf(".")
        )
        filename = filename+ '.csv'
        linkFileExport = __dirname + '/Public/Result/' + filename
        XLSX.writeFile(wb, linkFileExport)
    }

    /*upload file */
    if (req.files) {
        //upload file
        let file = req.files.files
        let time = Date.now()
        filename = time + file.name
        file.mv(__dirname + "/Public/Import/" + filename, (async (error) => {
            if (error) {
                console.log(error)
                res.send('error update file')
            } else {
                //read file upload
                let dir = __dirname + '/Public/Import/' + filename
                const workbook = XLSX.readFile(dir)
                const sheetNameList = workbook.SheetNames
                const dataFromWorkbook = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]])
                for (let index = 0; index < dataFromWorkbook.length; index++) {
                    const element = dataFromWorkbook[index];
                    isbn.push(element.isbn.toString())
                }
                console.log(`có ${isbn.length} isbn`)
                await excute(isbn).then(() => {
                    writeFile(results, filename)
                    return res.download(linkFileExport)
                })
            }
        }))
    }
});
