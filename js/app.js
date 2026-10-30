(function () {
  "use strict";

  const CONFIG = window.TIEM_CONFIG || {};

  const TOTAL_STEPS = 3;
  const MIN_STORY_WORDS = 15;
  const STORY_NEAR_LIMIT_RATIO = 0.9;
  const SUBMIT_TIMEOUT_MS = 45000;
  const DRAFT_KEY = "tiem-chuyen-nho:draft:v1";
  const DRAFT_DELAY_MS = 400;
  const COPY_RESET_MS = 2000;
  const NICKNAME_CREDIT = "Ghi nickname/TikTok ID";
  const DEFAULT_AMOUNT = "20000";

  const DRAFT_FIELDS = [
    "nickname", "topic", "setting", "characters", "story", "moment",
    "lesson", "feeling", "avoid", "credit", "contact",
  ];
  const CONSENT_FIELDS = ["consentOwn", "consentAdapt", "consentSelection"];

  const $ = (id) => document.getElementById(id);

  const form = $("story-form");
  const steps = Array.from(form.querySelectorAll(".step"));
  const progressSteps = Array.from($("progress").children);
  const backButton = $("back-button");
  const nextButton = $("next-button");
  const formError = $("form-error");
  const storyCount = $("story-count");
  const draftNotice = $("draft-notice");
  const defaultValues = readFields();

  let currentStep = 1;
  let isSubmitting = false;
  let draftTimer = null;

  /* ---------- Tiện ích ---------- */

  function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function fieldValue(name) {
    return form.elements[name].value;
  }

  function readFields() {
    const values = {};
    DRAFT_FIELDS.forEach((name) => {
      values[name] = fieldValue(name);
    });
    return values;
  }

  /* ---------- Điều hướng giữa các bước ---------- */

  function nextLabel() {
    return currentStep === TOTAL_STEPS ? "Gửi chuyện cho Tiệm 💌" : "Tiếp tục";
  }

  function goToStep(step, moveFocus) {
    currentStep = step;
    steps.forEach((el) => {
      el.hidden = Number(el.dataset.step) !== step;
    });
    progressSteps.forEach((el, index) => {
      const number = index + 1;
      el.classList.toggle("is-done", number < step);
      el.classList.toggle("is-current", number === step);
      if (number === step) {
        el.setAttribute("aria-current", "step");
      } else {
        el.removeAttribute("aria-current");
      }
    });
    backButton.hidden = step === 1;
    nextButton.textContent = nextLabel();
    hideFormError();

    if (moveFocus) {
      window.scrollTo(0, 0);
      steps[step - 1].querySelector("h2").focus({ preventScroll: true });
    }
  }

  /* ---------- Kiểm tra dữ liệu ---------- */

  function validateStep(step) {
    const errors = [];
    if (step === 1) {
      if (!fieldValue("topic")) {
        errors.push({ name: "topic", message: "Bạn chọn giúp Tiệm một chủ đề nhé." });
      }
      const words = countWords(fieldValue("story"));
      if (words === 0) {
        errors.push({ name: "story", message: "Tiệm chưa thấy câu chuyện của bạn. Bạn kể vài dòng nhé." });
      } else if (words < MIN_STORY_WORDS) {
        errors.push({
          name: "story",
          message: `Bạn kể thêm một chút nữa nhé, ít nhất ${MIN_STORY_WORDS} chữ để Tiệm hình dung được chuyện.`,
        });
      }
    }
    if (step === 2) {
      if (fieldValue("credit") === NICKNAME_CREDIT && !fieldValue("nickname").trim()) {
        errors.push({
          name: "credit",
          message: "Ở Bước 1 bạn chưa để lại nickname. Bạn quay lại điền, hoặc chọn cách nhắc tên khác nhé.",
        });
      }
    }
    if (step === 3) {
      if (CONSENT_FIELDS.some((name) => !form.elements[name].checked)) {
        errors.push({ name: "consent", message: "Bạn tick đủ cả 3 ô giúp Tiệm nhé." });
      }
    }
    return errors;
  }

  function firstControl(name) {
    if (name === "consent") {
      return CONSENT_FIELDS.map((field) => form.elements[field]).find((el) => !el.checked);
    }
    const control = form.elements[name];
    return control instanceof RadioNodeList ? control[0] : control;
  }

  function showErrors(errors) {
    errors.forEach(({ name, message }) => {
      $(`${name}-error`).textContent = message;
      if (name === "story") {
        form.elements.story.setAttribute("aria-invalid", "true");
      }
    });
    firstControl(errors[0].name).focus();
  }

  function clearError(name) {
    const key = CONSENT_FIELDS.includes(name) ? "consent" : name;
    const errorEl = $(`${key}-error`);
    if (errorEl) {
      errorEl.textContent = "";
    }
    if (key === "story") {
      form.elements.story.removeAttribute("aria-invalid");
    }
  }

  function clearAllErrors() {
    ["topic", "story", "credit", "consent"].forEach(clearError);
  }

  function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function hideFormError() {
    formError.hidden = true;
    formError.textContent = "";
  }

  /* ---------- Bộ đếm chữ ---------- */

  function updateStoryCount() {
    const story = form.elements.story;
    const words = countWords(story.value);
    const nearLimit = story.value.length >= story.maxLength * STORY_NEAR_LIMIT_RATIO;
    const enough = words >= MIN_STORY_WORDS;

    let text = `${words} chữ`;
    if (nearLimit) {
      text += " · Sắp hết chỗ viết rồi bạn ơi";
    } else if (enough) {
      text += " · Đủ rồi, cứ kể tiếp nếu bạn muốn";
    } else {
      text += ` · Cần ít nhất ${MIN_STORY_WORDS} chữ`;
    }
    storyCount.textContent = text;
    storyCount.classList.toggle("is-enough", enough && !nearLimit);
  }

  /* ---------- Nháp ---------- */

  function writeDraft(draft) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      // Trình duyệt chặn bộ nhớ thì bỏ qua, form vẫn dùng bình thường
    }
  }

  function readDraft() {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY));
    } catch (error) {
      return null;
    }
  }

  function removeDraft() {
    clearTimeout(draftTimer);
    draftTimer = null;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      // Như trên
    }
  }

  function saveDraft() {
    draftTimer = null;
    const fields = readFields();
    const hasContent = DRAFT_FIELDS.some((name) => fields[name] !== defaultValues[name]);
    if (hasContent) {
      writeDraft({ step: currentStep, fields });
    } else {
      removeDraft();
    }
  }

  function scheduleDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, DRAFT_DELAY_MS);
  }

  function flushDraft() {
    if (draftTimer !== null) {
      clearTimeout(draftTimer);
      saveDraft();
    }
  }

  // Ô tick không lưu vào nháp: người dùng nên xác nhận lại mỗi lần gửi
  function restoreDraft() {
    const draft = readDraft();
    if (!draft || !draft.fields) {
      return;
    }
    DRAFT_FIELDS.forEach((name) => {
      if (typeof draft.fields[name] === "string") {
        form.elements[name].value = draft.fields[name];
      }
    });
    updateStoryCount();
    const step = Number(draft.step);
    goToStep(Number.isInteger(step) && step >= 1 && step <= TOTAL_STEPS ? step : 1, false);
    draftNotice.hidden = false;
  }

  /* ---------- Gửi bài ---------- */

  function buildPayload() {
    const payload = {};
    DRAFT_FIELDS.forEach((name) => {
      payload[name] = fieldValue(name).trim();
    });
    CONSENT_FIELDS.forEach((name) => {
      payload[name] = form.elements[name].checked;
    });
    payload.website = form.elements.website.value;
    return payload;
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;
    nextButton.disabled = submitting;
    backButton.disabled = submitting;
    nextButton.textContent = submitting ? "Đang gửi..." : nextLabel();
  }

  // Không đặt header Content-Type: trình duyệt sẽ gửi text/plain, nhờ đó không có
  // CORS preflight (Apps Script không trả lời được request OPTIONS).
  async function postStory(payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
    try {
      const response = await fetch(CONFIG.SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function submitStory() {
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      const errors = validateStep(step);
      if (errors.length > 0) {
        if (step !== currentStep) {
          goToStep(step, true);
        }
        showErrors(errors);
        return;
      }
    }

    if (!CONFIG.SCRIPT_URL) {
      console.error("Chưa điền SCRIPT_URL trong js/config.js");
      showFormError("Tiệm chưa mở cửa nhận chuyện. Bạn quay lại sau nhé, bài viết của bạn vẫn được giữ nguyên ở đây.");
      return;
    }

    hideFormError();
    setSubmitting(true);
    try {
      const result = await postStory(buildPayload());
      if (!result.ok) {
        throw new Error(result.error || "");
      }
      removeDraft();
      showThanks();
    } catch (error) {
      console.error("Gửi chuyện thất bại:", error);
      showFormError(
        error instanceof Error && error.name === "Error" && error.message
          ? error.message
          : "Tiệm chưa nhận được chuyện, có thể mạng đang chập chờn. Bạn thử gửi lại nhé, bài viết vẫn còn nguyên."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function clearForm() {
    form.reset();
    removeDraft();
    clearAllErrors();
    updateStoryCount();
    draftNotice.hidden = true;
  }

  /* ---------- Trang cảm ơn ---------- */

  function buildQrUrl(amount) {
    const query = [];
    if (amount) {
      query.push(`amount=${amount}`);
    }
    if (CONFIG.TRANSFER_NOTE) {
      query.push(`addInfo=${encodeURIComponent(CONFIG.TRANSFER_NOTE)}`);
    }
    if (CONFIG.ACCOUNT_NAME) {
      query.push(`accountName=${encodeURIComponent(CONFIG.ACCOUNT_NAME)}`);
    }
    const bank = encodeURIComponent(CONFIG.BANK_ID);
    const account = encodeURIComponent(CONFIG.ACCOUNT_NO);
    return `https://img.vietqr.io/image/${bank}-${account}-compact2.png?${query.join("&")}`;
  }

  function renderQr(amount) {
    const image = $("qr-image");
    const label = amount ? `${Number(amount) / 1000}k` : "số tiền tuỳ tâm";
    image.hidden = false;
    $("qr-fallback").hidden = true;
    image.alt = `Mã QR chuyển khoản ${label} cho Tiệm Chuyện Nhỏ`;
    image.src = buildQrUrl(amount);
  }

  function selectAmount(amount) {
    const radios = document.querySelectorAll('input[name="amount"]');
    radios.forEach((radio) => {
      radio.checked = radio.value === amount;
    });
    renderQr(amount);
  }

  function setOptionalRow(rowId, valueId, value) {
    $(rowId).hidden = !value;
    $(valueId).textContent = value || "";
  }

  function setupDonate() {
    const hasBank = Boolean(CONFIG.BANK_ID && CONFIG.ACCOUNT_NO);
    const hasMomo = Boolean(CONFIG.MOMO_QR_IMAGE);

    $("donate").hidden = !hasBank && !hasMomo;
    $("bank-donate").hidden = !hasBank;
    $("momo").hidden = !hasMomo;

    if (hasBank) {
      $("bank-name").textContent = CONFIG.BANK_NAME || CONFIG.BANK_ID;
      $("bank-account").textContent = CONFIG.ACCOUNT_NO;
      setOptionalRow("bank-holder-row", "bank-holder", CONFIG.ACCOUNT_NAME);
      setOptionalRow("bank-note-row", "bank-note", CONFIG.TRANSFER_NOTE);
    }
    if (hasMomo) {
      $("momo-image").src = CONFIG.MOMO_QR_IMAGE;
    }
    if (CONFIG.TIKTOK_URL) {
      $("tiktok-link").href = CONFIG.TIKTOK_URL;
      $("tiktok-link").hidden = false;
    }
  }

  function showThanks() {
    clearForm();
    goToStep(1, false);
    $("intro").hidden = true;
    $("form-view").hidden = true;
    $("thanks-view").hidden = false;
    if (CONFIG.BANK_ID && CONFIG.ACCOUNT_NO) {
      selectAmount(DEFAULT_AMOUNT);
    }
    window.scrollTo(0, 0);
    $("thanks-title").focus({ preventScroll: true });
  }

  function showForm() {
    $("thanks-view").hidden = true;
    $("intro").hidden = false;
    $("form-view").hidden = false;
    window.scrollTo(0, 0);
    steps[0].querySelector("h2").focus({ preventScroll: true });
  }

  // Webview trong TikTok thường chặn Clipboard API nên cần đường lùi execCommand
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.readOnly = true;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      helper.setSelectionRange(0, text.length);
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (fallbackError) {
        copied = false;
      }
      helper.remove();
      return copied;
    }
  }

  async function handleCopy() {
    const button = $("copy-account");
    const copied = await copyText(CONFIG.ACCOUNT_NO);
    button.textContent = copied ? "Đã copy ✓" : "Nhấn giữ số để copy";
    $("copy-status").textContent = copied ? "Đã copy số tài khoản" : "Chưa copy được, bạn nhấn giữ số tài khoản để copy nhé";
    setTimeout(() => {
      button.textContent = "Copy";
      $("copy-status").textContent = "";
    }, COPY_RESET_MS);
  }

  /* ---------- Sự kiện ---------- */

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    if (currentStep === TOTAL_STEPS) {
      submitStory();
      return;
    }
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      showErrors(errors);
      return;
    }
    goToStep(currentStep + 1, true);
    scheduleDraft();
  });

  // Enter trong ô một dòng không được nhảy bước ngoài ý muốn; ô nhiều dòng vẫn xuống dòng bình thường
  form.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.tagName === "INPUT") {
      event.preventDefault();
    }
  });

  form.addEventListener("input", (event) => {
    if (event.target.name === "website") {
      return;
    }
    clearError(event.target.name);
    hideFormError();
    if (event.target.name === "story") {
      updateStoryCount();
    }
    scheduleDraft();
  });

  backButton.addEventListener("click", () => {
    goToStep(currentStep - 1, true);
    scheduleDraft();
  });

  $("draft-discard").addEventListener("click", () => {
    clearForm();
    goToStep(1, true);
  });

  $("tell-another").addEventListener("click", showForm);
  $("copy-account").addEventListener("click", handleCopy);

  document.querySelectorAll('input[name="amount"]').forEach((radio) => {
    radio.addEventListener("change", () => renderQr(radio.value));
  });

  $("qr-image").addEventListener("error", () => {
    $("qr-image").hidden = true;
    $("qr-fallback").hidden = false;
  });

  // Lưu nốt phần vừa gõ khi người dùng chuyển app hoặc đóng tab
  window.addEventListener("pagehide", flushDraft);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushDraft();
    }
  });

  /* ---------- Khởi động ---------- */

  setupDonate();
  updateStoryCount();
  goToStep(1, false);
  restoreDraft();
})();
