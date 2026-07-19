import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import * as fs from 'fs';

// Initialize the parser
const parser = new Parser();
parser.setLanguage(TypeScript.typescript);

process.on('message', (msg: any) => {
    if (msg.type === 'PARSE') {
        const { filePath, query } = msg;
        try {
            const code = fs.readFileSync(filePath, 'utf-8');
            const tree = parser.parse(code);
            
            // In the future, this is where we would execute the S-expression query 
            // against the parsed AST to check for pedagogical constraints.
            // For Phase 3, we simply prove parsing works without crashing.
            const passed = tree.rootNode.hasError() ? false : true;

            process.send?.({
                type: 'PARSE_RESULT',
                filePath,
                passed,
                error: passed ? null : 'Syntax error detected in AST.'
            });
        } catch (err: any) {
            process.send?.({
                type: 'PARSE_RESULT',
                filePath,
                passed: false,
                error: err.message
            });
        }
    }
});
