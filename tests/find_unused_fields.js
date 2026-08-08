import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const modelsDir = '/home/iamdayy/codes/himatika/server/models';
const serverDir = '/home/iamdayy/codes/himatika/server';

const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts'));

const fieldRegex = /^\s+([a-zA-Z0-9_]+)\s*:/;

const results = [];

for (const file of files) {
    const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
    const lines = content.split('\n');
    let insideSchema = false;
    for (const line of lines) {
        if (line.includes('new Schema')) {
            insideSchema = true;
        }
        
        if (insideSchema) {
            const match = line.match(fieldRegex);
            if (match) {
                const fieldName = match[1];
                // basic skip for common types
                if (['type', 'default', 'required', 'ref', 'index', 'enum'].includes(fieldName)) continue;
                
                try {
                    // search for the field name in the server directory
                    // -r for recursive, -l to just list files, -c to count?
                    // We just want to know if it's used OUTSIDE of its own model file.
                    // Wait, we can just do a grep for the word.
                    const cmd = `grep -rw "${fieldName}" ${serverDir} | wc -l`;
                    const count = parseInt(execSync(cmd, { encoding: 'utf8' }).trim(), 10);
                    
                    // it will be found at least once (in the model file itself).
                    // let's see if the count is <= 2 (sometimes there's an interface definition)
                    if (count <= 2) {
                        results.push({ model: file, field: fieldName, count });
                    }
                } catch (e) {
                    // ignore
                }
            }
        }
    }
}

fs.writeFileSync('/home/iamdayy/codes/himatika/tests/single_usage_fields.json', JSON.stringify(results, null, 2));
console.log('Done!');
