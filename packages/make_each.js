//===== Config Initialization =====//
const fs = require('fs');
const path = require('path');

//===== Each Loop Processing =====//
function processEachLoops(html) {
    const eachRegex = /<h:for\s+each="(\d+)">([\s\S]*?)<\/h:for>/g;
    return html.replace(eachRegex, (match, count, content) => {
        const loopCount = parseInt(count);
        let result = '';
        for (let i = 0; i < loopCount; i++) {
            let loopContent = content.replace(/\{index\}/g, i);
            loopContent = loopContent.replace(/\{index\+1\}/g, i + 1);
            loopContent = loopContent.replace(/\{count\}/g, loopCount);
            result += loopContent;
        }
        return result;
    });
}

//===== Advanced Each Loop Processing =====//
function processAdvancedEachLoops(html) {
    const advancedEachRegex = /<h:for\s+each="([^"]+)"\s+as="([^"]+)">([\s\S]*?)<\/h:for>/g;
    return html.replace(advancedEachRegex, (match, arrayName, itemName, content) => {
        const arrayItems = arrayName.split(',').map(item => item.trim());
        let result = '';
        arrayItems.forEach((item, index) => {
            let loopContent = content;
            loopContent = loopContent.replace(new RegExp(`\\{${itemName}\\}`, 'g'), item);
            loopContent = loopContent.replace(/\{index\}/g, index);
            loopContent = loopContent.replace(/\{index\+1\}/g, index + 1);
            loopContent = loopContent.replace(/\{count\}/g, arrayItems.length);
            result += loopContent;
        });
        return result;
    });
}

//===== Range Loop Processing =====//
function processRangeLoops(html) {
    const rangeRegex = /<h:for\s+range="(\d+),(\d+)">([\s\S]*?)<\/h:for>/g;
    return html.replace(rangeRegex, (match, start, end, content) => {
        const startNum = parseInt(start);
        const endNum = parseInt(end);
        let result = '';
        for (let i = startNum; i <= endNum; i++) {
            let loopContent = content;
            loopContent = loopContent.replace(/\{index\}/g, i);
            loopContent = loopContent.replace(/\{count\}/g, endNum - startNum + 1);
            result += loopContent;
        }
        return result;
    });
}

//===== Folder Loop Processing =====//
function processFolderLoops(html) {
    const folderRegex = /<h:for\s+folder="([^"]+)">([\s\S]*?)<\/h:for>/g;
    return html.replace(folderRegex, (match, folderPath, content) => {
        const projectRoot = path.join(__dirname, '..');
        const fullFolderPath = path.join(projectRoot, folderPath);
        
        if (!fs.existsSync(fullFolderPath) || !fs.statSync(fullFolderPath).isDirectory()) {
            return match; 
        }
        
        let result = '';
        try {
            const files = fs.readdirSync(fullFolderPath);
            files.forEach((file, index) => {
                const filePath = path.join(fullFolderPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isFile()) {
                    let loopContent = content;
                    loopContent = loopContent.replace(/\{filename\}/g, file);
                    loopContent = loopContent.replace(/\{filename\.name\}/g, path.parse(file).name);
                    loopContent = loopContent.replace(/\{filename\.ext\}/g, path.parse(file).ext);
                    loopContent = loopContent.replace(/\{filepath\}/g, path.join(folderPath, file));
                    loopContent = loopContent.replace(/\{index\}/g, index);
                    loopContent = loopContent.replace(/\{index\+1\}/g, index + 1);
                    loopContent = loopContent.replace(/\{count\}/g, files.length);
                    result += loopContent;
                }
            });
        } catch (err) {
            // Silent fail
        }
        
        return result;
    });
}

//===== File Loop Processing =====//
function processFileLoops(html) {
    const fileRegex = /<h:for\s+file="([^"]+)"\s+as="([^"]+)">([\s\S]*?)<\/h:for>/g;
    return html.replace(fileRegex, (match, filePath, contentVar, content) => {
        const projectRoot = path.join(__dirname, '..');
        const fullFilePath = path.join(projectRoot, filePath);
        
        if (!fs.existsSync(fullFilePath) || !fs.statSync(fullFilePath).isFile()) {
            return match; 
        }
        
        try {
            const fileContent = fs.readFileSync(fullFilePath, 'utf-8');
            let result = content;
            result = result.replace(new RegExp(`\\{${contentVar}\\}`, 'g'), fileContent);
            result = result.replace(/\{filename\}/g, path.basename(filePath));
            result = result.replace(/\{filepath\}/g, filePath);
            return result;
        } catch (err) {
            return match; 
        }
    });
}

//===== Main Processing Function =====//
function processLoops(html) {
    let processedHtml = html;
    processedHtml = processEachLoops(processedHtml);
    processedHtml = processAdvancedEachLoops(processedHtml);
    processedHtml = processRangeLoops(processedHtml);
    processedHtml = processFolderLoops(processedHtml);
    processedHtml = processFileLoops(processedHtml);
    return processedHtml;
}

//===== Export Functions =====//
module.exports = { 
    processLoops,
    processEachLoops,
    processAdvancedEachLoops,
    processRangeLoops,
    processFolderLoops,
    processFileLoops
};