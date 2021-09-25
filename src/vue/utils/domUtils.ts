export function scrollToElement(container: HTMLElement, element: HTMLElement): void {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  
  const padding = 10;
  const containerTop = containerRect.top + padding;
  const containerBottom = containerRect.bottom - padding;
  
  let offset = 0;
  if (containerBottom < elementRect.bottom)
    offset = elementRect.bottom - containerBottom;
  else if (containerTop > elementRect.top)
    offset = elementRect.top - containerTop;
  
  container.scrollTo({ top: container.scrollTop + offset, behavior: "smooth" });
}
