const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:5174/china-travel-story-map/');

  // Set fake state in IDB
  await page.evaluate(() => {
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

  // Now reload so Zustand reads from IDB
  console.log('Refreshing page...');
  await page.reload();
  
  // Wait a moment for hydration
  await new Promise(r => setTimeout(r, 1000));
  
  // Read back the state from IDB just to be sure it hasn't been overwritten
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

  console.log('IDB after refresh:', finalIdb ? JSON.parse(finalIdb).state.story.photos.length + ' photos' : 'Empty');

  await browser.close();
})();
