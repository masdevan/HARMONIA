//===== Config Initialization =====//
const fs = require('fs');
const path = require('path');

//===== Hot Reload Configuration =====//
let clients = new Set();
const watchedDirs = new Set();

//===== File Watcher Function =====//
function watchDirectory(dirPath, recursive = true) {
    if (watchedDirs.has(dirPath)) return;
    watchedDirs.add(dirPath);
    
    try {
        const watcher = fs.watch(dirPath, { recursive }, (eventType, filename) => {
            if (!filename) return;
            if (filename.includes('node_modules') || filename.includes('.git')) return;
            const ext = path.extname(filename).toLowerCase();
            const ignoredExtensions = ['.tmp', '.temp', '.log', '.lock'];
            if (!ignoredExtensions.includes(ext)) {
                if (ext !== '') {
                    notifyClients();
                }
            }
        });
    } catch (err) {
        // Do nothing
    }
}

//===== Client Notification =====//
function notifyClients() {
    setTimeout(() => {
        clients.forEach((client) => {
            try {
                client.write('data: reload\n\n');
            } catch (err) {
                clients.delete(client);
            }
        });
    }, 100);
}

//===== SSE Endpoint Handler =====//
function handleSSE(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });
    res.write('data: connected\n\n');
    clients.add(res);
    req.on('close', () => {
        clients.delete(res);
    });
}

//===== Hot Reload Script Injection =====//
function injectHotReloadScript(html) {
    const hotReloadScript = `
<script>
(function() {
    let eventSource = null;
    let isReloading = false;
    
    function connect() {
        if (isReloading) return;
        
        try {
            eventSource = new EventSource('/__hotreload');
            
            eventSource.onmessage = function(event) {
                if (event.data === 'reload' && !isReloading) {
                    isReloading = true;
                    window.location.reload();
                }
            };
            
            eventSource.onerror = function() {
                if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                }
                setTimeout(connect, 1000);
            };
        } catch (err) {
            setTimeout(connect, 1000);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', connect);
    } else {
        connect();
    }
})();
</script>`;
    
    if (html.includes('</body>')) {
        return html.replace('</body>', hotReloadScript + '\n</body>');
    } else {
        return html + hotReloadScript;
    }
}

//===== Initialize Hot Reload =====//
function initializeHotReload(server, baseDir) {
    const projectRoot = path.join(__dirname, '..');
    watchDirectory(projectRoot, true);
}

//===== Export Functions =====//
module.exports = { 
    initializeHotReload, 
    injectHotReloadScript,
    handleSSE,
    notifyClients 
};
