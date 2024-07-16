import { chromium } from 'playwright';
import dotenv from 'dotenv';
import open from 'open';
import clipboardy from 'clipboardy';
import notifier from 'node-notifier';

dotenv.config();

let mySelector = '[data-testid="tweetText"]';
let lastPolicyId = null;  // Variable to store the last policy ID

async function copyToClipboard(value) {
  await clipboardy.write(value);
}

(async () => {
  // Launch browser and context
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log in once
  await page.goto('https://x.com/i/flow/login');
  try {
    await page.waitForSelector('input[name="text"]');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1); // Exit the process with a non-zero status code
  }

  await page.fill('input[name="text"]', process.env.USER);
  await page.click('//*[@id="layers"]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/button[2]/div');
  await page.waitForSelector('input[name="password"]');
  await page.fill('input[name="password"]', process.env.PASSWORD);
  await page.click('#layers > div:nth-child(2) > div > div > div > div > div > div.css-175oi2r.r-1ny4l3l.r-18u37iz.r-1pi2tsx.r-1777fci.r-1xcajam.r-ipm5af.r-g6jmlv.r-1awozwy > div.css-175oi2r.r-1wbh5a2.r-htvplk.r-1udh08x.r-1867qdf.r-kwpbio.r-rsyp9y.r-1pjcn9w.r-1279nm1 > div > div > div.css-175oi2r.r-1ny4l3l.r-6koalj.r-16y2uox.r-kemksi.r-1wbh5a2 > div.css-175oi2r.r-16y2uox.r-1wbh5a2.r-f8sm7e.r-13qz1uu.r-1ye8kvj > div.css-175oi2r.r-1f0wa7y > div > div.css-175oi2r > div > div > button > div');
  await page.waitForNavigation();
  await page.goto('https://x.com/snekx_io');
  await page.waitForNavigation();
  await page.waitForSelector(mySelector);

  async function performOperations() {
    await page.reload();
    await page.waitForSelector(mySelector);
    const elements = await page.$$(mySelector);
    const thirdElement = elements[2];
    const firstElInnerText = await thirdElement.innerText();
    console.log(firstElInnerText);

    if (firstElInnerText.includes('LP Burnt %: 100%') && firstElInnerText.includes('Token pooled %: 100%')) {
      const policyidRegex = /\b[a-z0-9]{56}\b/; // Adjust regex pattern as per your actual format

      const match = firstElInnerText.match(policyidRegex);
      if (match) {
        const policyid = match[0]; // Assuming the policyid is captured in the first capture group
        if (policyid !== lastPolicyId) { // Check if the current policy ID is different from the last one
          lastPolicyId = policyid; // Update the last policy ID
          console.log(policyid);

          (async () => {
            notifier.notify({
              title: 'TOKEN RELEASED',
              message: 'Perform goBuy',
            });
            await copyToClipboard(policyid);
            await open('https://app.dexhunter.io/');
            // Alternatively, use an indefinite wait to keep the browser open until you manually close it
            await page.waitForTimeout(20000); // 20000 milliseconds = 20 seconds
          })();
        }
      }
    }
  }

  const intervalId = setInterval(() => {
    performOperations().catch(console.error);
  }, 30000);

  // Ensure the browser is closed gracefully on exit
  process.on('SIGINT', async () => {
    clearInterval(intervalId);
    await browser.close();
    process.exit();
  });
})();
