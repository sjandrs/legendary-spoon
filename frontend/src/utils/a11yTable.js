// Small helpers to standardize accessible table markup across components
// Usage:
//   const headerIds = getHeaderIds('accounts', ['name','industry',...]);
//   <th id={headerIds.name} scope="col">Name</th>
//   <th scope="row" headers={headerIds.name}>Row value</th>

export const createHeaderId = (prefix, key) => `${prefix}-${key}-col`;

export const getHeaderIds = (prefix, keys) => {
  return keys.reduce((acc, key) => {
    acc[key] = createHeaderId(prefix, key);
    return acc;
  }, {});
};

export const headersAttr = (headerIds, ...keys) => keys.map(k => headerIds[k]).join(' ');
