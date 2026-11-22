// PostToolUse: düzenlenen .js dosyasında `node --check` çalıştırır.
const { execFileSync } = require('child_process');
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let file;
  try { file = JSON.parse(input.replace(/^\uFEFF/, '')).tool_input?.file_path || ''; } catch { process.exit(0); }
  if (!/\.(js|mjs|cjs)$/i.test(file)) process.exit(0);
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (e) {
    process.stderr.write(`Sözdizimi hatası (${file}):\n${e.stderr || e.message}`);
    process.exit(2);
  }
});
