//===== Config Initialization =====//
const http      = require('http');
const fs        = require('fs');
const path      = require('path');
const { renderWithComponents } = require('./make_components');
const { envReader, injectEnvVars } = require('./make_envreader');
const { getMimeType } = require('./make_mimelist');
const { initializeHotReload, injectHotReloadScript, handleSSE } = require('./make_hotreload');

const env = envReader();
let hostname  = env.HOSTNAME || '127.0.0.1';
if (hostname === 'localhost') hostname = '127.0.0.1';
const port      = env.PORT ? parseInt(env.PORT) : 2000;
const baseDir   = path.join(__dirname, '..', env.BASEDIR || 'src/app');

//===== Server Main Code =====//
function startServer(portToTry) {
  const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    
    // Handle SSE endpoint for hot reload
    if (urlPath === '/__hotreload') {
      handleSSE(req, res);
      return;
    }
    
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

    //===== Static File Definition =====//
    const staticDir = path.join(__dirname, '..');
    const staticFilePath = path.join(staticDir, urlPath);
    if (fs.existsSync(staticFilePath) && fs.statSync(staticFilePath).isFile()) {
      const ext = path.extname(staticFilePath).toLowerCase();
      const contentType = getMimeType(ext);
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(fs.readFileSync(staticFilePath));
      return;
    }

    let filePath = path.join(baseDir, `${urlPath}.html`);
    if (!fs.existsSync(filePath)) {
      const folderPath = path.join(baseDir, urlPath);
      const indexPath = path.join(folderPath, 'index.html');
      
      if (fs.existsSync(indexPath)) {
        filePath = indexPath;
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('404 Not Found');
        return;
      }
    }

    try {
      const html = renderWithComponents(filePath);
      const htmlWithEnv = injectEnvVars(html, env);
      const htmlWithHotReload = injectHotReloadScript(htmlWithEnv);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(htmlWithHotReload);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end('500 Internal Server Error');
    }
  });

  //===== Server Listener =====//
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${portToTry} is already in use, trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(portToTry, hostname, () => {
    console.log(`Server is running at http://${hostname}:${portToTry}/`);
    initializeHotReload(server, baseDir);
  });
}

startServer(port);
