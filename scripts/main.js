"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  // Мобильное меню
  const menuToggle = document.querySelector(".header__menu-toggle");
  const menu = document.querySelector("#header-menu");
  const desktopMenuQuery = window.matchMedia("(min-width: 62.5rem)");

  if (menuToggle && menu) {
    const setMenuOpen = (isOpen) => {
      menu.classList.toggle("is-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Закрыть меню" : "Открыть меню"
      );
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isOpen);
    });

    menu.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');

      if (!link || !menu.contains(link)) return;

      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: reduceMotionQuery.matches ? "auto" : "smooth",
        block: "start"
      });

      history.pushState(null, "", targetId);

      if (!desktopMenuQuery.matches) {
        setMenuOpen(false);
        menuToggle.focus({ preventScroll: true });
      }
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        menuToggle.getAttribute("aria-expanded") === "true"
      ) {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });

    desktopMenuQuery.addEventListener("change", (event) => {
      if (event.matches) {
        setMenuOpen(false);
      }
    });
  }

  // FAQ: закрывать другие ответы при открытии нового
  const faqItems = document.querySelectorAll(".faq__item");

  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;

      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.open = false;
        }
      });
    });
  });

  // Форма и модальное окно
  const form = document.querySelector("[data-callback-form]");
  const modal = document.querySelector("#success-modal");

  if (!form || !modal) {
    console.error("Не найдена форма [data-callback-form] или #success-modal.");
    return;
  }

  const nameInput = form.querySelector("#callback-name");
  const phoneInput = form.querySelector("#callback-phone");
  const consentInput = form.querySelector("#callback-consent");
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('[type="submit"]');
  const closeButtons = modal.querySelectorAll("[data-modal-close]");

  if (!nameInput || !phoneInput || !consentInput) {
    console.error(
      "Проверьте ID полей формы: callback-name, callback-phone, callback-consent."
    );
    return;
  }

  let previouslyFocusedElement = null;
  let isSubmitting = false;

  const getErrorElement = (input) =>
    document.getElementById(`${input.id}-error`);

  const setError = (input, message) => {
    input.setAttribute("aria-invalid", "true");

    const error = getErrorElement(input);

    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  };

  const clearError = (input) => {
    input.removeAttribute("aria-invalid");

    const error = getErrorElement(input);

    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  };

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, "");

    // Удаляем код страны, если пользователь ввёл номер с 7 или 8.
    if (digits.startsWith("7") || digits.startsWith("8")) {
      digits = digits.slice(1);
    }

    digits = digits.slice(0, 10);

    let formatted = "+7";

    if (digits.length > 0) {
      formatted += ` (${digits.slice(0, 3)}`;
    }

    if (digits.length >= 3) {
      formatted += ")";
    }

    if (digits.length > 3) {
      formatted += ` ${digits.slice(3, 6)}`;
    }

    if (digits.length > 6) {
      formatted += `-${digits.slice(6, 8)}`;
    }

    if (digits.length > 8) {
      formatted += `-${digits.slice(8, 10)}`;
    }

    return formatted;
  };

  const getPhoneDigits = () => phoneInput.value.replace(/\D/g, "");

  const openModal = () => {
    previouslyFocusedElement = document.activeElement;

    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }

    modal.querySelector("[data-modal-close]")?.focus();
  };

  const closeModal = () => {
    if (typeof modal.close === "function" && modal.open) {
      modal.close();
    } else {
      modal.removeAttribute("open");
    }

    if (
      previouslyFocusedElement &&
      typeof previouslyFocusedElement.focus === "function"
    ) {
      previouslyFocusedElement.focus();
    }
  };

  const validateName = () => {
    const name = nameInput.value.trim();

    if (name.length < 2 || name.length > 60) {
      setError(nameInput, "Введите имя длиной от 2 до 60 символов.");
      return false;
    }

    if (!/^[\p{L}\p{M}\s\-’']+$/u.test(name)) {
      setError(nameInput, "В имени допустимы буквы, пробелы и дефис.");
      return false;
    }

    clearError(nameInput);
    return true;
  };

  const validatePhone = () => {
    const digits = getPhoneDigits();

    // После форматирования в поле остаётся +7 и десять цифр.
    if (!/^[78]\d{10}$/.test(digits)) {
      setError(phoneInput, "Введите российский номер полностью: +7 и 10 цифр.");
      return false;
    }

    clearError(phoneInput);
    return true;
  };

  const validateConsent = () => {
    if (!consentInput.checked) {
      setError(
        consentInput,
        "Поставьте отметку согласия, чтобы продолжить."
      );
      return false;
    }

    clearError(consentInput);
    return true;
  };

  phoneInput.addEventListener("input", () => {
    phoneInput.value = formatPhone(phoneInput.value);
    clearError(phoneInput);
  });

  nameInput.addEventListener("input", () => {
    clearError(nameInput);
  });

  consentInput.addEventListener("change", () => {
    clearError(consentInput);
  });

  nameInput.addEventListener("blur", validateName);
  phoneInput.addEventListener("blur", validatePhone);
  consentInput.addEventListener("blur", validateConsent);

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  modal.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (status) {
      status.textContent = "";
      status.classList.remove("is-error");
    }

    const isNameValid = validateName();
    const isPhoneValid = validatePhone();
    const isConsentValid = validateConsent();

    if (!isNameValid || !isPhoneValid || !isConsentValid) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const formData = {
      name: nameInput.value.trim(),
      phone: phoneInput.value,
      personal_data_consent: consentInput.checked
    };

    console.info("Данные формы проверены:", formData);

    isSubmitting = true;

    if (submitButton) {
      submitButton.disabled = true;
    }

    if (status) {
      status.textContent =
        "Данные заполнены корректно. Для отправки заявки подключите обработчик формы.";
    }

    openModal();

    isSubmitting = false;

    if (submitButton) {
      submitButton.disabled = false;
    }
  });
});