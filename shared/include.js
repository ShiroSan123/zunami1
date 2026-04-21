const rootPrefix = document.documentElement.dataset.rootPrefix || "./";

const replaceRootTokens = (markup) => markup.replace(/\{\{root\}\}/g, rootPrefix);

const loadSharedPart = async (node) => {
  const response = await fetch(node.dataset.include);
  if (!response.ok) {
    throw new Error(`Failed to load ${node.dataset.include}`);
  }

  const markup = replaceRootTokens(await response.text());
  node.outerHTML = markup;
};

document.addEventListener("DOMContentLoaded", async () => {
  const includeNodes = Array.from(document.querySelectorAll("[data-include]"));

  await Promise.all(includeNodes.map(loadSharedPart));
  document.querySelectorAll("[data-footer-date]").forEach((node) => {
    node.textContent = `Дата обновления информации: ${new Date().toLocaleDateString("ru")}`;
  });
  document.dispatchEvent(new CustomEvent("shared:loaded"));
});
