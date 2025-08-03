//===== Library Initialization =====//
const fs = require('fs');
const path = require('path');
const { injectEnvVars, envReader } = require('./make_envreader');
const { processLoops } = require('./make_each');
const env = envReader();

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

//===== Component Path Resolver =====//
function resolveComponentPath(tagName, currentFilePath, projectRoot) {
    if (!tagName.includes('.')) {
        return path.join(path.dirname(currentFilePath), `${tagName}.html`);
    }

    const parts = tagName.split('.');
    const baseDir = parts[0]; 
    const remainingParts = parts.slice(1);
    const componentPath = path.join(projectRoot, 'src', baseDir, ...remainingParts) + '.html';
    return componentPath;
}

//===== Process Components Function =====//
function processComponents(html, filePath, processedFiles = new Set()) {
    const projectRoot = path.join(__dirname, '..');
    
    if (processedFiles.has(filePath)) {
        return html;
    }
    processedFiles.add(filePath);
    
    html = html.replace(/<([a-zA-Z0-9_\-\.]+)([^>]*)\/>/g, (match, tagName, attrStr) => {
        const compPath = resolveComponentPath(tagName, filePath, projectRoot);
        
        if (fs.existsSync(compPath)) {
            let compHtml = fs.readFileSync(compPath, 'utf-8');
            const attrs = parseAttributes(attrStr);
        
            for (const key in attrs) {
                const attrValue = injectEnvVars(attrs[key], env);
                compHtml = compHtml.replace(new RegExp(`\{insert\.${key}\}`, 'g'), attrValue);
            }
            
            compHtml = processComponents(compHtml, compPath, processedFiles);
            return compHtml;
        }
        return match;
    });

    html = html.replace(/<([a-zA-Z0-9_\-\.]+)([^>]*)>([\s\S]*?)<\/\1>/g, (match, tagName, attrStr, innerContent) => {
        const compPath = resolveComponentPath(tagName, filePath, projectRoot);
        
        if (fs.existsSync(compPath)) {
            let compHtml = fs.readFileSync(compPath, 'utf-8');
            const attrs = parseAttributes(attrStr);
            for (const key in attrs) {
                const attrValue = injectEnvVars(attrs[key], env);
                compHtml = compHtml.replace(new RegExp(`\{insert\.${key}\}`, 'g'), attrValue);
            }
            if (/<h:slot\s*\/?>([\s\S]*?)?/i.test(compHtml)) {
                compHtml = compHtml.replace(/<h:slot\s*\/?>([\s\S]*?)?/i, innerContent);
            }
            compHtml = processComponents(compHtml, compPath, processedFiles);
            
            return compHtml;
        }
        return match;
    });
    
    return html;
}

//===== Server Main Code =====//
function renderWithComponents(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');
    html = processComponents(html, filePath);
    html = processLoops(html);
    
    return html;
}

//===== Initialization =====//
module.exports = { renderWithComponents };
