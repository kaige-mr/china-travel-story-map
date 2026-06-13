const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://127.0.0.1:5174/china-travel-story-map/');
  await page.waitForSelector('.editor-panel', { timeout: 5000 });

  // Simulate updating the store
  await page.evaluate(() => {
    // We can't access useStoryStore directly unless it's on window, but let's dispatch an event or mutate IDB directly 
    // to see if the app reacts, or simulate a Zustand state update.
    // Let's just use IDB to set a state manually, then refresh, and see if Zustand picks it up.
    return new Promise((resolve) => {
      const req = indexedDB.open('keyval-store');
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('keyval', 'readwrite');
        const store = tx.objectStore('keyval');
        
        const fakeState = {
          state: {
            story: {
              id: "fake-id",
              title: "Persisted Title",
              photos: [
                { id: "photo-1", url: "data:image/png;base64,123", caption: "Test", width: 100, height: 100, sortIndex: 0, cityId: "", storyId: "fake-id" }
              ]
            }
          },
          version: 0
        };
        store.put(JSON.stringify(fakeState), 'china-memory-story-auto-save').onsuccess = () => resolve('Stored');
      };
    });
  });

  console.log('Refreshing page...');
  await page.reload();
  await page.waitForSelector('.editor-panel', { timeout: 5000 });
  
  // Read back the state from IDB
  const finalIdb = await page.evaluate(() => {
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

  console.log('IDB after refresh:', finalIdb ? JSON.parse(finalIdb).state.story.title : 'Empty');

  await browser.close();
})();
