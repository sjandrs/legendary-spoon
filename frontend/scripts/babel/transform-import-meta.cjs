// Custom Babel plugin to neutralize import.meta references for Jest environment
// Replaces any occurrence of `import.meta` with an empty object literal `({})`.
// This prevents ESM-only runtime constructs (e.g., import.meta.hot) from breaking under Jest's CJS transpilation.
module.exports = function transformImportMeta() {
  return {
    name: 'transform-import-meta-to-empty-object',
    visitor: {
      MetaProperty(path) {
        const { node, parent } = path;
        if (node.meta && node.meta.name === 'import' && node.property && node.property.name === 'meta') {
          // Replace `import.meta` with an IIFE returning empty object to avoid accidental mutation assumptions
            path.replaceWithSourceString('({})');
        }
      },
    },
  };
};
