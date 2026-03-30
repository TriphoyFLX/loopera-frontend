export default function jsxDevFix() {
  return {
    name: 'jsx-dev-fix',
    generateBundle(options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.js') && chunk.type === 'chunk') {
          // Заменяем jsxDEV = void 0 на правильную функцию
          chunk.code = chunk.code.replace(
            /reactJsxDevRuntime_production\.jsxDEV\s*=\s*void\s*0/g,
            `reactJsxDevRuntime_production.jsxDEV = function(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
              var children = config.children;
              if (void 0 !== children) {
                if (isStaticChildren) {
                  if (Array.isArray(children)) {
                    for (var i = 0; i < children.length; i++) {
                      if (typeof children[i] === 'object' && children[i] !== null) {
                        // Validate child keys
                      }
                    }
                    Object.freeze && Object.freeze(children);
                  }
                }
              }
              var key = null;
              if (void 0 !== maybeKey) {
                key = String(maybeKey);
              }
              if (hasValidKey(config)) {
                key = String(config.key);
              }
              var props = config;
              if ('key' in config) {
                props = {};
                for (var propName in config) {
                  if (propName !== 'key') {
                    props[propName] = config[propName];
                  }
                }
              }
              return {
                $$typeof: Symbol.for("react.transitional.element"),
                type: type,
                key: key,
                ref: config.ref || null,
                props: props,
                _owner: null
              };
            }`
          );
          
          // Добавляем функцию валидации ключа
          chunk.code = chunk.code.replace(
            /var hasRequiredJsxDevRuntime;/,
            `function hasValidKey(config) {
              if (hasOwnProperty.call(config, 'key')) {
                return void 0 !== config.key;
              }
              return false;
            }
            var hasRequiredJsxDevRuntime;`
          );
        }
      }
    }
  };
}
