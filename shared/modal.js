const setFormStatus = (form, message, isError = false) => {
  const status = form.querySelector(".form-status");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("is-error", isError);
  status.classList.toggle("is-success", !isError && !!message);
};

const initStaticForms = () => {
  document.querySelectorAll(".js-static-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      setFormStatus(form, "");

      if (!form.reportValidity()) {
        setFormStatus(form, "Проверьте обязательные поля.", true);
        return;
      }

      setFormStatus(form, form.dataset.successMessage || "Форма отправлена.");
      form.reset();
    });
  });
};

const initModal = () => {
  const modal = document.querySelector("[data-modal]");
  if (!modal) {
    initStaticForms();
    return;
  }

  const toggleModal = (forceState) => {
    const nextState =
      typeof forceState === "boolean" ? forceState : !modal.classList.contains("is-open");

    modal.classList.toggle("is-open", nextState);
    modal.setAttribute("aria-hidden", String(!nextState));
    document.body.classList.toggle("is-locked", nextState);
  };

  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => toggleModal(true));
  });

  modal.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => toggleModal(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleModal(false);
    }
  });

  initStaticForms();
};

document.addEventListener("shared:loaded", initModal);
