const path = require('path');
const fs = require('fs');

const serverRoot = path.join(__dirname, '../..');

const envFiles = [
    path.join(serverRoot, '.env'),
    path.join(serverRoot, '../.env'),
    path.join(__dirname, '.env'),
];

function loadEnv() {
    const dotenv = require('dotenv');
    for (const file of envFiles) {
        if (fs.existsSync(file)) {
            dotenv.config({ path: file });
        }
    }
}

loadEnv();

module.exports = { loadEnv, serverRoot };
