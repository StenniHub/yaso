export function fromStorage(key) {
  return JSON.parse(localStorage.getItem(key));
}

export function toStorage(key, value) {
  localStorage[key] = value;
}
