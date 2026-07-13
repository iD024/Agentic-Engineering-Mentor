import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const mainPath = path.resolve(__dirname, '../dist/main.js');
  
  console.log(`Starting simulation using ${mainPath}`);
  
  const child = spawn('node', [mainPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env, LOG_LEVEL: 'warn' } // reduce noise
  });

  let messageId = 1;
  const sendRequest = (method: string, params?: any) => {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
      
      const onData = (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.id === id) {
              child.stdout.removeListener('data', onData);
              resolve(parsed);
            }
          } catch (e) {
            // ignore partial JSON or logs if they appear on stdout
          }
        }
      };
      
      child.stdout.on('data', onData);
      child.stdin.write(msg);
    });
  };

  try {
    // 1. Initialize Handshake
    console.log('\n--- Sending initialize ---');
    const initResponse = await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'simulate', version: '1.0.0' }
    });
    console.log('Initialize Response:', JSON.stringify(initResponse, null, 2));

    // 2. List Tools
    console.log('\n--- Sending tools/list ---');
    const listResponse = await sendRequest('tools/list', {});
    console.log('Tools/List Response:', JSON.stringify(listResponse, null, 2));

    // 3. Invoke GetWorkspace
    console.log('\n--- Sending tools/call (GetWorkspace) ---');
    const workspaceRes = await sendRequest('tools/call', { name: 'GetWorkspace', arguments: { workspaceId: 'default' } });
    console.log('GetWorkspace Response:', JSON.stringify(workspaceRes, null, 2));

    // 4. Invoke FindDefinition
    console.log('\n--- Sending tools/call (FindDefinition) ---');
    const findDefRes = await sendRequest('tools/call', { name: 'FindDefinition', arguments: { symbolName: 'ToolRegistry' } });
    console.log('FindDefinition Response:', JSON.stringify(findDefRes, null, 2));

    // 5. Invoke GetRepositorySummary
    console.log('\n--- Sending tools/call (GetRepositorySummary) ---');
    const repoSummaryRes = await sendRequest('tools/call', { name: 'GetRepositorySummary', arguments: {} });
    console.log('GetRepositorySummary Response:', JSON.stringify(repoSummaryRes, null, 2));

    // 6. Invoke ImpactAnalysis
    console.log('\n--- Sending tools/call (ImpactAnalysis) ---');
    const impactRes = await sendRequest('tools/call', { name: 'ImpactAnalysis', arguments: { targetNodeIds: ['src/tools/tools.json'] } });
    console.log('ImpactAnalysis Response:', JSON.stringify(impactRes, null, 2));

    // 7. Invoke CompleteMilestone
    console.log('\n--- Sending tools/call (CompleteMilestone) ---');
    const milestoneRes = await sendRequest('tools/call', { name: 'CompleteMilestone', arguments: { milestoneId: 'm1' } });
    console.log('CompleteMilestone Response:', JSON.stringify(milestoneRes, null, 2));

  } catch (err) {
    console.error('Simulation error:', err);
  } finally {
    child.kill();
  }
}

run().catch(console.error);
