const path = require('path');

const puppeteer = require('puppeteer');
const express = require('express');

const _getStaticUrl = port => process.env.STATIC_URL.replace('{port}', port);

const _newStaticServer = () => {
  const app = express();
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    next();
  });

  // Choose a random, free port
  const server = app.listen(0, () => console.log('Tests static server listening on port ' + server.address().port));

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../', 'static/views'));
  app.use('/', express.static(path.join(__dirname, '../', '../')));

  app.get('/tests/static/', (req, res) => {
    const url = `${req.protocol}://${req.get('host')}/xrpackage.js`;
    res.render('index', {url});
  });

  return server;
};

module.exports = async (t, run) => {
  // Windows environment needs fewer flags
  const args = process.platform === 'win32'
    ? ['--no-sandbox']
    : ['--no-sandbox', '--ignore-gpu-blacklist', '--ignore-gpu-blocklist', '--use-gl=desktop'];

  const browser = await puppeteer.launch({
    headless: false, // Multisampled depth buffers with no GPU (headless chrome) is buggy
    devtools: true,
    ignoreDefaultArgs: true,
    args,
  });
  const page = await browser.newPage();
  page.on('console', consoleObj => console.log('Page log:', consoleObj.text()));
  page.on('pageerror', err => console.error('Page error: ', err.message, err.stack));
  page.on('requestfailed', req => console.error('Request failed: ', req.method(), req.url(), req.response().status()));

  const server = _newStaticServer();
  const port = server.address().port;
  t.context.staticUrl = _getStaticUrl(port);

  try {
    // Wait for no more network requests for at least 500ms before passing onto main test
    await page.goto(t.context.staticUrl, {waitUntil: 'networkidle0'});

    // Expose safeEvaluate function to try...catch page functions for better stack traces
    await page.evaluate(() => {
      window.safeEvaluate = async function(fn) {
        try {
          return await fn();
        } catch (err) {
          console.error(err.stack);
          return null;
        }
      };
    });

    await run(t, page);
  } finally {
    server.close();
    await page.close();
    await browser.close();
  }
};
