const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix mixed backtick and single quote
content = content.replace(/fetch\(`\$\{API_BASE_URL\}([^`']+)'\)/g, 'fetch(`${API_BASE_URL}$1`)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed quote issues in App.js');
