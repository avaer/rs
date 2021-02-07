/* global XRPackage */
const fs = require('fs');
const path = require('path');

const test = require('ava');
const wbn = require('wbn');

const withPageAndStaticServer = require('./utils/_withPageAndStaticServer');

const manifest = {
  start_url: 'index.html',
  xr_type: 'webxr-site@0.0.1',
};

test('create webxr xrpk with manifest first', withPageAndStaticServer, async (t, page) => {
  await performTest(t, page, true);
});

test('create webxr xrpk with manifest not first', withPageAndStaticServer, async (t, page) => {
  await performTest(t, page, false);
});

const performTest = async (t, page, manifestFirst) => {
  const indexHtml = fs.readFileSync(path.join(__dirname, 'static', 'assets', 'webxr-cube.html'), 'utf-8');
  const blobString = await page.evaluate(pageFunction, manifest, indexHtml, manifestFirst);
  const buf = Buffer.from(blobString, 'base64');
  const bundle = new wbn.Bundle(buf);
  t.is(bundle.urls.length, 2);

  const manifestUrl = bundle.urls.find(u => path.basename(u) === 'manifest.json');
  t.truthy(manifestUrl);

  const manifestBody = bundle.getResponse(manifestUrl).body.toString('utf-8');
  t.deepEqual(JSON.parse(manifestBody), manifest);

  const assetUrl = bundle.urls.find(u => path.basename(u) === 'index.html');
  t.truthy(assetUrl);

  const assetResponse = bundle.getResponse(assetUrl);
  t.is(assetResponse.headers['content-type'], 'text/html');

  const assetBody = assetResponse.body.toString('utf-8');
  t.is(assetBody, indexHtml);
};

const pageFunction = async (manifest, indexHtml, manifestFirst) => {
  const xrpk = new XRPackage();

  if (manifestFirst) {
    xrpk.addFile('manifest.json', JSON.stringify(manifest), 'application/json');
    xrpk.addFile('index.html', indexHtml, 'text/html');
  } else {
    xrpk.addFile('index.html', indexHtml, 'text/html');
    xrpk.addFile('manifest.json', JSON.stringify(manifest), 'application/json');
  }

  xrpk.addFile('unwantedFile.html', indexHtml, 'text/html');
  xrpk.removeFile('unwantedFile.html');

  const uint8Array = await xrpk.export();
  const uint8ArrayToBase64 = async uint8Array => new Promise(resolve => {
    const blob = new Blob([uint8Array]);
    const reader = new FileReader();
    reader.onload = event => resolve(event.target.result.replace(/data:.*base64,/, ''));
    reader.readAsDataURL(blob);
  });

  // Puppeteer only supports passing serializable data to/from Node
  const base64 = await uint8ArrayToBase64(uint8Array);
  return base64;
};
