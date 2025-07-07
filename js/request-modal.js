const modal      = document.getElementById('request-modal');
const overlay    = modal.querySelector('.modal__overlay');
const openBtn    = document.querySelector('.request-button');

openBtn.addEventListener('click', () => {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
});
overlay.addEventListener('click', closeModal);

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
  resetSteps();
}

/* DOM элементы */
const smsForm          = document.getElementById('smsForm');
const codeForm         = document.getElementById('codeForm');
const phoneInput       = smsForm.querySelector('input[name=phone]');
const msg1             = document.getElementById('message');
const msg2             = document.getElementById('codeMessage');
const resendBtn        = document.getElementById('resendCode');
const hiddenCodeInput  = document.getElementById('hiddenCode');

let currentPhone = '', resendTimer = null, callTimer = null;

/* Переключение шагов */
function showStep(el) {
  modal.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  if (el === codeForm) setupCodeBoxes();
}

function resetSteps() {
  clearTimers();
  smsForm.reset(); codeForm.reset();
  showStep(smsForm);
  msg1.textContent = ''; msg2.textContent = '';
  resendBtn.disabled = false;
  resendBtn.textContent = 'Отправить повторно';
}

/* Отправка номера */
smsForm.addEventListener('submit', e => {
  e.preventDefault();
  currentPhone = phoneInput.value.replace(/\D/g, '');
  if (currentPhone.length !== 11 || !currentPhone.startsWith('7')) {
    msg1.textContent = 'Введите правильный номер в формате +7...';
    msg1.classList.add('error');
    return;
  }
  sendCode('sms');
});

function sendCode(method = 'sms') {
  clearTimers();

  msg1.textContent = 'Отправка...'; msg1.className = 'message';
  msg2.textContent = ''; msg2.className = 'message';

  const fd = new FormData();
  fd.append('phone', currentPhone);
  fd.append('method', method);

  fetch('send_sms.php', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(d => {
      if (d.success) {
        showStep(codeForm);

        if (method === 'sms') {
          startCallTimer();
        }

        startResendTimer();
      } else {
        msg1.textContent = 'Ошибка: ' + d.error;
        msg1.classList.add('error');
      }
    })
    .catch(() => {
      msg1.textContent = 'Ошибка сети';
      msg1.classList.add('error');
    });
}

/* Код (4 цифры) */
function setupCodeBoxes() {
  const boxes = document.querySelectorAll('.code-box');
  boxes.forEach((b, i) => {
    b.value = '';
    b.oninput = () => {
      b.value = b.value.replace(/\D/g, '');
      if (b.value && i < 3) boxes[i + 1].focus();
      hiddenCodeInput.value = [...boxes].map(x => x.value).join('');
    };
    b.onkeydown = e => {
      if (e.key === 'Backspace' && !b.value && i > 0) boxes[i - 1].focus();
    };
  });
  boxes[0].focus();
}

codeForm.addEventListener('submit', e => {
  e.preventDefault();
  const code = hiddenCodeInput.value.trim();
  if (code.length !== 4) {
    msg2.textContent = 'Введите 4 цифры кода';
    msg2.classList.add('error');
    return;
  }

  msg2.textContent = 'Проверка...'; msg2.className = 'message';

  const fd = new FormData();
  fd.append('phone', currentPhone);
  fd.append('code', code);

  fetch('verify_code.php', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(d => {
      if (d.success) {
        closeModal(); // Модальное окно закрывается полностью
        clearTimers();
      } else {
        msg2.textContent = 'Ошибка: ' + d.error;
        msg2.classList.add('error');
      }
    })
    .catch(() => {
      msg2.textContent = 'Ошибка сети';
      msg2.classList.add('error');
    });
});

/* Таймеры */
function startCallTimer() {
  let s = 120;

  callTimer = setInterval(() => {
    s--;
    if (s <= 0) {
      clearInterval(callTimer);
      sendCode('call'); // автоматический звонок
    }
  }, 1000);
}

function startResendTimer() {
  let s = 60;
  resendBtn.disabled = true;
  resendBtn.textContent = `Отправить повторно (${s})`;

  resendTimer = setInterval(() => {
    s--;
    resendBtn.textContent = `Отправить повторно (${s})`;
    if (s <= 0) {
      clearInterval(resendTimer);
      resendBtn.disabled = false;
      resendBtn.textContent = 'Отправить повторно';
    }
  }, 1000);
}

function clearTimers() {
  if (resendTimer) clearInterval(resendTimer);
  if (callTimer) clearInterval(callTimer);
}

/* Повторная отправка */
resendBtn.addEventListener('click', () => {
  sendCode('sms');
  startResendTimer();
});