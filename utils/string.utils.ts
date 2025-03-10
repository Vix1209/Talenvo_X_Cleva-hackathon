export function toSnakeCase(str: string): string {
  return str
    .replace(/\s+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2') 
    .replace(/(^|_)([a-z])/g, (_, p1, p2) => `${p1}${p2.toUpperCase()}`); 
}