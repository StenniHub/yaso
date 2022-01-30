export function clone(object: unknown): unknown {
  return JSON.parse(JSON.stringify(object));
}