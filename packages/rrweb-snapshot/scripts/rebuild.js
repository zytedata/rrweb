/*
 Usage: node scripts/rebuild.js rrweb-snapshot.json
 The script can also load GZIP compressed files, eg: .json.gz
*/
const fs = require('fs');
const puppeteer = require('puppeteer');
const { promisify } = require('util');
const { unzip } = require('zlib');

// assume that rrWeb script is in this folder
const rrWeb = './dist/rrweb-snapshot.js';
const rrFile = process.argv[2];
const waitSec = parseInt(process.argv[3] || 60);
const PAGE_TIMEOUT = 5000;

function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time))
}

const describe = (jsHandle) => {
    return jsHandle.executionContext().evaluate((obj) => {
        return typeof obj === 'string' ? obj : `${typeof obj}=${obj}`
    }, jsHandle)
}

(async function main() {
    const browser = await puppeteer.launch({
        args: [
            '--disable-breakpad',
            '--disable-default-apps',
            '--disable-full-history-sync',
            '--disable-notifications',
            '--disable-speech-api',
            '--disable-translate',
            '--disable-web-security',
            '--ignore-gpu-blacklist',
            '--mute-audio',
            '--no-default-browser-check',
            '--no-pings',
            '--start-maximized',
        ],
        defaultViewport: null,
        headless: false,
    });
    browser.on('disconnected', process.exit);
    const page = await browser.newPage();

    // listen to the browser console messages and scan objects
    page.on('console', async (msg) => {
        const args = await Promise.all(msg.args().map((arg) => describe(arg)));
        let text = '';
        for (let i = 1; i < args.length; ++i) {
            text += `${args[i]} `;
        }
        console.log(`CONSOLE ${msg.type()} :: ${msg.text()}`);
        if (text.trim()) {
            console.log(text.trim());
        }
    });

    // restoring snapshots shouldn't need internet
    // enable internet to discover potential issues
    await page.setOfflineMode(true);
    // restore shouldn't need JS
    await page.setJavaScriptEnabled(false);

    await page.setContent('<html><head></head><body></body></html>');
    const rrCode = await fs.promises.readFile(rrWeb, { encoding: 'utf8' });
    let snap = await fs.promises.readFile(rrFile);
    if (rrFile.endsWith('.gz')) {
        snap = (await promisify(unzip)(snap)).toString();
    }

    await page.evaluate(`(function(){
      console.log('Restoring the snaphot...');
      ${rrCode};
      rrwebSnapshot.rebuild(${snap}, {doc: document});
      console.log('Snaphot restored!');
      for (let s of document.getElementsByTagName("noscript")) {
        // Hide all restored noscript tags
        s.style.display = "none";
      }
    })();`);

    await page.waitForSelector('*', { timeout: PAGE_TIMEOUT });
    await delay(waitSec * 1000);

    await browser.close();
})();
