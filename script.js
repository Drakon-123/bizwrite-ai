let selectedType = "social";
let selectedTone = "professional";
let history = [];
let sessionKey = "";
let freeTrialUsed = false;

const API_URL = "https://web-production-dda4d.up.railway.app";

const prompts = {
  social: "Write an engaging social media caption",
  product: "Write a compelling product description",
  reply: "Write a professional and friendly customer reply",
  invoice: "Write a polite and professional invoice/payment message",
  promo: "Write an attractive promotional message",
  email: "Write an engaging email newsletter",
  ad: "Write high-converting ad copy",
  blog: "Write a captivating blog introduction"
};

window.onload = function() {
  const savedKey = localStorage.getItem("bizwrite_key");
  if (savedKey) {
    sessionKey = savedKey;
    showApp();
    return;
  }

  freeTrialUsed = localStorage.getItem("bizwrite_trial_used") === "true";

  if (freeTrialUsed) {
    // Show app but generateContent will hit paywall
    showApp();
  } else {
    showApp();
    showTrialBanner();
  }
};

function showTrialBanner() {
  const banner = document.createElement("div");
  banner.id = "trialBanner";
  banner.innerHTML = `<div class="trial-banner">You have <strong>1 free generation</strong> remaining. <a href="landing.html" target="_blank">Get unlimited access for $19</a></div>`;
  document.querySelector(".card").prepend(banner);
}

function showPaywall() {
  const output = document.getElementById("output");
  output.innerHTML = `
    <div class="paywall">
      <h3>You've used your free generation!</h3>
      <p>Get unlimited access to BizWrite AI — all 8 content types, all 5 tones, forever.</p>
      <a href="landing.html" target="_blank" class="paywall-btn">Get Unlimited Access — $19</a>
      <div class="paywall-key">Already purchased? <span onclick="showKeyInput()">Enter your access key</span></div>
    </div>
  `;
  output.classList.remove("hidden");
}

function showKeyInput() {
  document.getElementById("gate").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

async function verifyKey() {
  const key = document.getElementById("keyInput").value.trim().toUpperCase();
  const btn = document.getElementById("keyBtn");
  const error = document.getElementById("keyError");

  if (!key) {
    showKeyError("Please enter your access key.");
    return;
  }

  btn.textContent = "Verifying...";
  btn.disabled = true;
  error.classList.add("hidden");

  try {
    const response = await fetch(`${API_URL}/verify-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key })
    });

    const data = await response.json();

    if (data.valid) {
      sessionKey = key;
      localStorage.setItem("bizwrite_key", key);
      showApp();
      const banner = document.getElementById("trialBanner");
      if (banner) banner.remove();
    } else {
      showKeyError(data.reason || "Invalid access key.");
      btn.textContent = "Unlock Access";
      btn.disabled = false;
    }
  } catch (err) {
    showKeyError("Connection error. Please try again.");
    btn.textContent = "Unlock Access";
    btn.disabled = false;
  }
}

function showKeyError(msg) {
  const error = document.getElementById("keyError");
  error.textContent = msg;
  error.classList.remove("hidden");
}

function showApp() {
  document.getElementById("gate").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

// Type buttons
document.querySelectorAll(".type-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type;
  });
});

// Tone buttons
document.querySelectorAll(".tone-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tone-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTone = btn.dataset.tone;
  });
});

// Character counter
document.getElementById("businessInfo").addEventListener("input", function() {
  document.getElementById("charHint").textContent = this.value.length + " characters typed";
});

async function generateContent() {
  const businessInfo = document.getElementById("businessInfo").value.trim();

  if (!businessInfo) {
    alert("Please describe your business or situation first.");
    return;
  }

  const prompt = `${prompts[selectedType]} in a ${selectedTone} tone for the following business: ${businessInfo}. Be specific, creative and compelling. Write only the content itself with no extra explanation.`;

  const btn = document.getElementById("generateBtn");
  const btnText = document.getElementById("btnText");
  const spinner = document.getElementById("spinner");
  const output = document.getElementById("output");
  const result = document.getElementById("result");

  btn.disabled = true;
  btnText.classList.add("hidden");
  spinner.classList.remove("hidden");
  output.classList.add("hidden");

  try {
    const isPaid = !!sessionKey;
    const trialUsed = localStorage.getItem("bizwrite_trial_used") === "true";

    if (!isPaid && trialUsed) {
      showPaywall();
      btn.disabled = false;
      btnText.classList.remove("hidden");
      spinner.classList.add("hidden");
      return;
    }

    const response = await fetch(`${API_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, key: sessionKey || "trial" })
    });

    const data = await response.json();

    if (data.error) {
      result.textContent = "Something went wrong. Please try again.";
    } else {
      result.textContent = data.result;
      document.getElementById("charCount").textContent = data.result.length + " characters";
      addToHistory(data.result);

      if (!isPaid) {
        localStorage.setItem("bizwrite_trial_used", "true");
        freeTrialUsed = true;
        const banner = document.getElementById("trialBanner");
        if (banner) banner.innerHTML = `<div class="trial-banner used">Free trial used. <a href="landing.html" target="_blank">Get unlimited access for $19</a></div>`;
      }
    }

    output.classList.remove("hidden");

  } catch (error) {
    result.textContent = "Please wait a moment and try again.";
    output.classList.remove("hidden");
  }

  btn.disabled = false;
  btnText.classList.remove("hidden");
  spinner.classList.add("hidden");
}

function addToHistory(text) {
  history.unshift({ type: selectedType, tone: selectedTone, text });
  if (history.length > 3) history.pop();

  const section = document.getElementById("historySection");
  const list = document.getElementById("historyList");

  section.classList.remove("hidden");
  list.innerHTML = "";

  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<div class="history-item-type">${item.type} — ${item.tone}</div>${item.text.substring(0, 120)}...`;
    div.addEventListener("click", () => {
      document.getElementById("result").textContent = item.text;
      document.getElementById("charCount").textContent = item.text.length + " characters";
      document.getElementById("output").classList.remove("hidden");
      window.scrollTo({ top: document.getElementById("output").offsetTop - 100, behavior: "smooth" });
    });
    list.appendChild(div);
  });
}

function copyResult() {
  const text = document.getElementById("result").innerText;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  window.getSelection().removeAllRanges();

  const btn = document.getElementById("copyBtn");
  btn.textContent = "Copied!";
  setTimeout(() => btn.textContent = "Copy to Clipboard", 2000);
}
