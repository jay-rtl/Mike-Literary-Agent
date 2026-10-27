// Preserve old bookmarks while keeping public URLs free of file extensions.
(() => {
  const destination = document.currentScript?.dataset.target;
  const target = destination
    ? new URL(destination, location.href)
    : location.pathname.endsWith('/index.html') ? new URL('./', location.href) : null;
  if (!target || target.origin !== location.origin) return;
  target.search = location.search;
  target.hash = location.hash;
  location.replace(target.href);
})();
