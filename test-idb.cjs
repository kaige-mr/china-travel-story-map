const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://127.0.0.1:5174/china-travel-story-map/');
  
  // Set some data in indexedDB manually or trigger the app to add photos
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const req = indexedDB.open('keyval-store');
      req.onsuccess = (e) => {
        const db = e.target.result;
        try {
          const tx = db.transaction('keyval', 'readonly');
          const store = tx.objectStore('keyval');
          const getReq = store.get('china-memory-story-auto-save');
          getReq.onsuccess = () => resolve(getReq.result);
        } catch (e) {
          resolve('No keyval store yet');
        }
      };
    });
  }).then(res => console.log('IDB initially:', res));

  await browser.close();
})();
