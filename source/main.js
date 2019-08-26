const pptr = require('puppeteer-core');
const request = require('request');

(async () => {
    await launchBrowser();
})();

async function launchBrowser() {
    let browser = await pptr.launch({ executablePath: 'E:\\website_mirror\\Code\\WebsiteMirror\\Source\\21-Build\\Server\\node_modules\\puppeteer\\.local-chromium\\win64-579032\\chrome-win32\\chrome.exe'});
    try {
        let page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto('https://www.cnblogs.com/skabyy/p/11396571.html');
        await page.screenshot({ fullPage: true, path: 'microServices.jpg' });
        await page.close();
    } catch (error) {
        console.log(error);
    }

    await browser.close();
}

async function connectBrowser() {
    let debugEndpoint = await connect('127.0.0.1', 8768);
    console.log(`CefSharp browser debug url address is: ${debugEndpoint}`);
    let browser = await pptr.connect({ browserWSEndpoint: debugEndpoint });
    let pages = await browser.pages();
    try {
        let page = pages[0];
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto('https://www.cnblogs.com/skabyy/p/11396571.html');
        await page.waitFor(10000);
    } catch (error) {
        console.log(error);
    }

    await browser.disconnect();
}

function connect(_host, _port) {
    return new Promise((resolve, reject) => {
        let versionUrl = `http://${_host}:${_port}/json/version`;
        request(versionUrl, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                let entity = {};
                if (typeof body === 'string') {
                    entity = JSON.parse(body);
                }

                const url = entity.webSocketDebuggerUrl;
                resolve(url);
            } else {
                console.error('链接调试接口失败！');
                reject('链接调试接口失败！');
            }
        });
    });
}