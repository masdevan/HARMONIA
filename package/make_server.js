//===== Config Initialization =====//
const http      = require('http');
const fs        = require('fs');
const path      = require('path');
const { renderWithComponents } = require('./make_components');

const hostname  = '127.0.0.1';
const port      = 2000;
const baseDir   = path.join(__dirname, '../src');

//===== Server Main Code =====//
const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index';
  }
  
  if (urlPath.endsWith('/')) {
    urlPath = urlPath.slice(0, -1);
  }

  if (urlPath.includes('..')) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Bad Request');
    return;
  }
  const filePath = path.join(baseDir, `${urlPath}.html`);
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('404 Not Found');
    return;
  }
  try {
    const html = renderWithComponents(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('500 Internal Server Error');
  }
});

//===== Server Listener =====//
server.listen(port, hostname, () => {
  console.log(`Server is running at http://${hostname}:${port}/`);
});
