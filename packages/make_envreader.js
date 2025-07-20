//===== Config Initialization =====//
const fs = require('fs');
const path = require('path');

//===== Env Reader Code =====//
function envReader(envPath) {
    if (!envPath) {
        envPath = path.resolve(__dirname, '../.env');
    }
    if (!fs.existsSync(envPath)) return {};
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    const env = {};
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        env[key] = value;
    }
    return env;
}

function injectEnvVars(html, env) {
    return html.replace(/\{ENV\.([A-Z0-9_]+)\}/g, (match, key) => {
        return env[key] !== undefined ? env[key] : match;
    });
}

module.exports = { envReader, injectEnvVars };
