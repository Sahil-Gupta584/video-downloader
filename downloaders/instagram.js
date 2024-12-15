import puppeteer from "puppeteer";
import * as cheerio from 'cheerio';
import fs from 'fs';  


// Instagram credentials
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME;
const INSTAGRAM_PASSWORD = process.env.INSTAGRAM_PASSWORD;

// File to store the cookies
const COOKIES_FILE_PATH = './instagram_cookies.json';

// Function to login and get new cookies
async function resetCookies(page) {
    try {
        console.log('Logging into Instagram...');
        await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

        // Fill the login form
        
        await page.type('input[name="username"]', INSTAGRAM_USERNAME, { delay: 100 });
        await page.type('input[name="password"]', INSTAGRAM_PASSWORD, { delay: 100 });

        // Submit the form and wait for navigation
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);

        // Save cookies after successful login
        const cookies = await page.cookies();
        fs.writeFileSync(COOKIES_FILE_PATH, JSON.stringify(cookies, null, 2), { encoding: 'utf8' });

        return cookies;
    } catch (error) {
        console.log(error.message, error, 'from resetCookies');
        return null

    }
}

// Function to load cookies from file

async function loadCookies(page) {
    try {
        const cookieData = fs.readFileSync(COOKIES_FILE_PATH, { encoding: 'utf-8' });

        if (cookieData.trim()) { // Check if the file has non-empty content
            const cookies = JSON.parse(cookieData); // Parse the cookies
            console.log('Cookies loaded from file.');
            await page.setCookie(...cookies); // Set the cookies in Puppeteer
        } else {
            console.log('Cookies file is empty. resetting cookies');
        await resetCookies(page);
        }
    } catch (error) {
        console.error('Error loading cookies:', error.message);
    }
}



async function getPostPageHtml(page, inputUrl) {
    if(inputUrl.includes('/reel/')){
        inputUrl = `https://www.instagram.com/reel/${inputUrl.split('/reel/')[1].slice(0,11)}`
        
    }
    console.log('getting post page html of', inputUrl)
    
    try {
        await page.goto(inputUrl, { waitUntil: ['networkidle2', 'domcontentloaded'] });
        const text = await page.$eval('*', el => el.innerText);
        // console.log(text);
        const isModal = text.includes('View story');


        if (isModal) {
            console.log("Detected 'View Story' modal, attempting to click...");

            await page.evaluate(() => {
                const storyButton = Array.from(document.querySelectorAll('div[role="button"]'))
                    .find(div => div.textContent.includes('View story'));
                console.log('storyButton', storyButton);

                if (storyButton) storyButton.click();
            });

        }
        console.log('isModal', isModal);

        await page.waitForFunction(() => (
            document.querySelectorAll('script[type][data-content-len][data-sjs]').length > 0
        ));



        return await page.content();
    } catch (error) {
        console.log('Error fetching page HTML:', error);
        return null;
    }
}


export default function instagram(inputUrl){
    return new  Promise(async (resolve, reject) => {
        
        console.log('inputUrl', inputUrl)

        let browser;
        browser = await puppeteer.launch({
            headless: false,
            // executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
        });
    try {


        const page = await browser.newPage();

        await loadCookies(page);

        if (!inputUrl) {
            reject({ error: 'Please enter a valid Instagram URL', status: 400 });
        }



        const htmlContent = await getPostPageHtml(page, inputUrl);
        const $ = cheerio.load(htmlContent.toString());
        let downloadUrl;

        if (inputUrl.includes('/p/')) {
            console.log('getting img ...');

            // _acay for slideshow photos
            // _aagu[0] for single image


            const imgTag = $('div[class^="_aagu"] img').toArray()
            if (!imgTag.length > 0) {
                reject({ error: 'Url not found, make sure image link is of single image and not of slideshow, slideshows phtotos are not supported ', status: 400 });
            }

            // console.log('imgTag.length', imgTag.length);
            downloadUrl = imgTag[0].attribs.src
            // console.log('imgTag[0]', imgTag[0].attribs.src);
        } else {
            console.log('finding videos just for you...');


            const urlAvailable = $('script[type][data-content-len][data-sjs]').toArray().find((el) => el.children[0].data.includes('.mp4'));

            if (urlAvailable) {
                console.log('Download URL found in the HTML content');
                const parsed = JSON.parse(urlAvailable.children[0].data);
                downloadUrl = inputUrl.includes('/reel/') ?
                    parsed.require[0][3][0].__bbox.require[0][3][1].__bbox.result.data.xdt_api__v1__media__shortcode__web_info.items[0].video_versions
                    :
                    parsed.require[0][3][0].__bbox.require[0][3][1].__bbox.result.data.xdt_api__v1__feed__reels_media.reels_media[0].items[0].video_versions

            }
            if (!urlAvailable) {

                console.log('No video URL found trying again...');
                const cookies = await resetCookies(page);
                await loadCookies(page);
                const htmlContent = await getPostPageHtml(page, inputUrl);

                const $ = cheerio.load(htmlContent.toString());
                const isUrl = $('script[type][data-content-len][data-sjs]').toArray().find((el) => el.children[0].data.includes('.mp4'));

                if (!isUrl) {
                    reject({ error: 'No video URL found', status: 404 });
                }

                const parsed = JSON.parse(isUrl.children[0].data);
                downloadUrl = inputUrl.includes('/reel/') ?
                    parsed.require[0][3][0].__bbox.require[0][3][1].__bbox.result.data.xdt_api__v1__media__shortcode__web_info.items[0].video_versions
                    :
                    parsed.require[0][3][0].__bbox.require[0][3][1].__bbox.result.data.xdt_api__v1__feed__reels_media.reels_media[0].items[0].video_versions


            }
        }

        await browser.close();
        console.log('downloadUrl', downloadUrl);

        if (downloadUrl) {
            resolve({ status: 200, downloadUrl });
        } else {
            reject({ error: 'No video URL found', status: 404 });
        }

    } catch (error) {
        console.log('Error:', error);
        if (browser) await browser.close();
        reject({ error: error.message, status: 500 });
    }
})

}
