const fs = require('fs');
const path = require('path');

const contentDir = '/home/iamdayy/codes/himatika-docs/content';

function checkDir(dir) {
    const items = fs.readdirSync(dir);
    const numbered = items.map(i => {
        const match = i.match(/^(\d+)\./);
        return match ? { name: i, num: parseInt(match[1], 10) } : null;
    }).filter(Boolean);

    numbered.sort((a, b) => a.num - b.num);

    let expected = 1;
    let missing = [];
    for (const item of numbered) {
        while (expected < item.num) {
            missing.push(expected);
            expected++;
        }
        expected = item.num + 1;
        
        const fullPath = path.join(dir, item.name);
        if (fs.statSync(fullPath).isDirectory()) {
            checkDir(fullPath);
        }
    }
    
    if (missing.length > 0) {
        console.log(`In ${dir}, missing numbers: ${missing.join(', ')}`);
    }
}

checkDir(contentDir);
