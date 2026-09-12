const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const pluginRoot = path.join(__dirname, '..');
const testFiles = [
  'src/components/content-ai-agents/utils/segment-payload.test.ts',
  'src/components/content-ai-agents/utils/diff-segments.test.ts',
  'src/components/content-ai-agents/utils/history-store.test.ts',
  'src/components/content-ai-agents/utils/build-history-entry.test.ts',
  'src/components/content-ai-agents/utils/attribute-cause.test.ts',
  'src/components/content-ai-agents/utils/analyze-run.test.ts',
  'src/components/content-ai-agents/utils/format-run-for-copy.test.ts',
];

const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2019,
  esModuleInterop: true,
  jsx: ts.JsxEmit.React,
};

require.extensions['.ts'] = (mod, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions,
    fileName: filename,
  });

  mod._compile(outputText, filename);
};

let failed = false;

testFiles.forEach(relativePath => {
  const filePath = path.join(pluginRoot, relativePath);

  // eslint-disable-next-line no-console
  console.log(`\n${path.basename(relativePath)}`);

  const { ok } = require(filePath);

  if (!ok) {
    failed = true;
  }
});

if (failed) {
  process.exit(1);
}
