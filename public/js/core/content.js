export async function loadContent() {
  const response = await fetch('./content/library.json');
  if (!response.ok) throw new Error('Recovery content could not be opened.');
  const content = await response.json();
  if (content.schema !== 1) throw new Error('This version of the app cannot open the recovery library.');
  return content;
}

export function find(items, id) {
  return items.find(item => item.id === id);
}
