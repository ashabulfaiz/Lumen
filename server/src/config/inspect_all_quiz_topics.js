const fs = require('fs');
const path = require('path');

function printTopics(level) {
    const filePath = path.join(__dirname, `../../../ds-service/${level}.json`);
    if (!fs.existsSync(filePath)) {
        console.log(`${level}.json does not exist`);
        return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const uniqueTopics = [...new Set(data.map(item => item.kategori_topik))];
    console.log(`\n--- Topics in ${level}.json ---`);
    console.log(uniqueTopics);
}

printTopics('Beginner');
printTopics('Intermediate');
printTopics('Advanced');
