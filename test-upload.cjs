const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://127.0.0.1:5174/china-travel-story-map/');
  
  // Wait for app
  await page.waitForSelector('.app-shell', { timeout: 5000 });
  
  // Expand editor if collapsed
  const isEditorHidden = await page.evaluate(() => {
    return document.querySelector('.editor-panel') === null;
  });
  if (isEditorHidden) {
    await page.evaluate(() => {
      document.querySelector('.toggle-editor-btn')?.click();
    });
    await page.waitForSelector('.editor-panel', { timeout: 2000 });
  }

  // Find file input and upload a dummy image
  // We'll create a dummy image first
  const dummyImagePath = 'dummy.png';
  const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(dummyImagePath, dummyBuffer);

  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile(dummyImagePath);

  // Wait a bit for processing
  await new Promise(r => setTimeout(r, 2000));
  
  // Check if photos are in Zustand state / IDB
  const idbState = await page.evaluate(() => {
    return new Promise((resolve) => {
      const req = indexedDB.open('keyval-store');
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('keyval', 'readonly');
        const store = tx.objectStore('keyval');
        const getReq = store.get('china-memory-story-auto-save');
        getReq.onsuccess = () => resolve(getReq.result);
      };
    });
  });

  console.log('IDB after upload:', idbState ? JSON.parse(idbState).state.story.photos.length + ' photos' : 'Empty');

  await browser.close();
  fs.unlinkSync(dummyImagePath);
})();
