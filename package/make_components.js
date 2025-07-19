//===== Library Initialization =====//
const fs = require('fs');
const path = require('path');

//===== Server Main Code =====//
function renderWithComponents(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');

    html = html.replace(/<([a-zA-Z0-9_\-\.]+)\s*\/>/g, (match, tagName) => {
        let compPath;
        if (tagName.includes('.')) {
            const parts = tagName.split('.');
            compPath = path.join(path.dirname(filePath), parts[0], `${parts[1]}.html`);
        } else {
            compPath = path.join(path.dirname(filePath), `${tagName}.html`);
        }
        if (fs.existsSync(compPath)) {
            return fs.readFileSync(compPath, 'utf-8');
        }
        return match;
    });

    html = html.replace(/<([a-zA-Z0-9_\-\.]+)>([\s\S]*?)<\/\1>/g, (match, tagName, innerContent) => {
        let compPath;
        if (tagName.includes('.')) {
            const parts = tagName.split('.');
            compPath = path.join(path.dirname(filePath), parts[0], `${parts[1]}.html`);
        } else {
            compPath = path.join(path.dirname(filePath), `${tagName}.html`);
        }
        if (fs.existsSync(compPath)) {
            let compHtml = fs.readFileSync(compPath, 'utf-8');
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
