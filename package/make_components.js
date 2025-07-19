//===== Library Initialization =====//
const fs = require('fs');
const path = require('path');

//===== Custom Attribut =====//
function parseAttributes(str) {
    const attrs = {};
    const attrRegex = /([a-zA-Z0-9_\-]+)\s*=\s*"([^"]*)"/g;
    let match;
    while ((match = attrRegex.exec(str))) {
        attrs[match[1]] = match[2];
    }
    return attrs;
}

//===== Server Main Code =====//
function renderWithComponents(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');

    html = html.replace(/<([a-zA-Z0-9_\-\.]+)([^>]*)\/>/g, (match, tagName, attrStr) => {
        let compPath;
        if (tagName.includes('.')) {
            const parts = tagName.split('.');
            compPath = path.join(path.dirname(filePath), parts[0], `${parts[1]}.html`);
        } else {
            compPath = path.join(path.dirname(filePath), `${tagName}.html`);
        }
        if (fs.existsSync(compPath)) {
            let compHtml = fs.readFileSync(compPath, 'utf-8');
            const attrs = parseAttributes(attrStr);
            for (const key in attrs) {
                compHtml = compHtml.replace(new RegExp(`\{insert\.${key}\}`, 'g'), attrs[key]);
            }
            return compHtml;
        }
        return match;
    });

    html = html.replace(/<([a-zA-Z0-9_\-\.]+)([^>]*)>([\s\S]*?)<\/\1>/g, (match, tagName, attrStr, innerContent) => {
        let compPath;
        if (tagName.includes('.')) {
            const parts = tagName.split('.');
            compPath = path.join(path.dirname(filePath), parts[0], `${parts[1]}.html`);
        } else {
            compPath = path.join(path.dirname(filePath), `${tagName}.html`);
        }
        if (fs.existsSync(compPath)) {
            let compHtml = fs.readFileSync(compPath, 'utf-8');
            const attrs = parseAttributes(attrStr);
            for (const key in attrs) {
                compHtml = compHtml.replace(new RegExp(`\{insert\.${key}\}`, 'g'), attrs[key]);
            }
            if (/<h:slot\s*\/?>([\s\S]*?)?/i.test(compHtml)) {
                compHtml = compHtml.replace(/<h:slot\s*\/?>([\s\S]*?)?/i, innerContent);
                return compHtml;
            } else {
                return compHtml;
            }
        }
        return match;
    });
    return html;
}

//===== Initialization =====//
module.exports = { renderWithComponents };
