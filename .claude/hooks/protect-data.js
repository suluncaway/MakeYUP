// PreToolUse: büyük veri arşivlerinin elle düzenlenmesi için onay ister.
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let file;
  try { file = JSON.parse(input.replace(/^\uFEFF/, '')).tool_input?.file_path || ''; } catch { process.exit(0); }
  if (/[\\/]js[\\/]data[\\/][^\\/]+\.json$/i.test(file)) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: 'Büyük veri arşivi (js/data/*.json) elle düzenleniyor — script ile üretmek tercih edilir.'
      }
    }));
  }
  process.exit(0);
});
