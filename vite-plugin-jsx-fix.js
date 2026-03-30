export default function jsxDevFix() {
  return {
    name: 'jsx-dev-fix',
    generateBundle(options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.js') && chunk.type === 'chunk') {
          // Сначала заменяем jsxDEV = void 0 на функцию
          chunk.code = chunk.code.replace(
            /reactJsxDevRuntime_production\.jsxDEV\s*=\s*void\s*0/g,
            'reactJsxDevRuntime_production.jsxDEV = function(type, config, maybeKey, isStaticChildren, debugStack, debugTask) { return { $$typeof: Symbol.for("react.transitional.element"), type: type, key: maybeKey, ref: config.ref || null, props: config, _owner: null }; }'
          );
        }
      }
    }
  };
}
