const initCookieBanner = () => {
  const rootPrefix = document.documentElement.dataset.rootPrefix || "./";

  if (localStorage.getItem("cookie-ok")) {
    return;
  }

  const banner = document.createElement("div");
  banner.className = "cookie-banner";
  banner.innerHTML = `
    <div class="cookie-banner__inner section-shell">
      <p>
        Оставаясь на сайте вы соглашаетесь на использование cookie и обработку данных
        в соответствии с <a href="${rootPrefix}politica/index.html">политикой</a>.
      </p>
      <button class="button-primary" type="button">OK</button>
    </div>
  `;

  document.body.append(banner);

  banner.querySelector("button")?.addEventListener("click", () => {
    localStorage.setItem("cookie-ok", "1");
    banner.remove();
  });
};

document.addEventListener("shared:loaded", initCookieBanner);
