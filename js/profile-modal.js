/* ---------- переменные ---------- */
const modalP = document.getElementById('profile-modal');
const overlayP = modalP.querySelector('.modal__overlay');
const headerProfileBtn = document.getElementById('header-profile-btn'); // Кнопка в хедере (для десктопа)
const mobileProfileBtn = document.getElementById('mobile-profile-btn'); // Кнопка в мобильном меню
const profileModalCloseBtn = document.getElementById('profileModalCloseBtn');
const smsFormP = document.getElementById('smsFormProfile');
const codeFormP = document.getElementById('codeFormProfile');
const notRegP = document.getElementById('notRegisteredStep');
const phoneInpP = document.getElementById('phoneInputProfile');
const msg1P = document.getElementById('messageProfile');
const msg2P = document.getElementById('codeMessageProfile');
const hiddenCodeP = document.getElementById('hiddenCodeProfile');
const codeBoxesP = codeFormP.querySelectorAll('.code-box');

let currentPhoneP = '', resendTimerP = null, callTimerP = null;

/* ---------- Открытие/закрытие ---------- */
// Теперь обе кнопки "Личный кабинет" (десктопная и мобильная)
// будут вызывать новую функцию handleProfileButtonClick() при клике.
// Эта функция будет отвечать за проверку сессии на сервере.
if (headerProfileBtn) {
    headerProfileBtn.addEventListener('click', handleProfileButtonClick);
}
if (mobileProfileBtn) {
    mobileProfileBtn.addEventListener('click', handleProfileButtonClick);
}
overlayP?.addEventListener('click', closeProfileModal);
// Это позволяет корректно закрывать окно.
if (profileModalCloseBtn) {
    profileModalCloseBtn.addEventListener('click', closeProfileModal);
}
// Асинхронная функция для проверки статуса авторизации на сервере.
async function handleProfileButtonClick() {
    try {
        const response = await fetch('check_auth.php', { method: 'POST' });
        const data = await response.json(); // Парсим JSON-ответ от сервера
        if (data.authenticated) {
            // Если сервер ответил, что пользователь авторизован (authenticated: true)
            console.log("Пользователь аутентифицирован. Перенаправление на lk.html");
            window.location.href = 'lk.html';
        } else {
            console.log("Пользователь не аутентифицирован. Открытие модального окна.");
            openProfileModal();
        }
    } catch (error) {
        console.error('Ошибка при проверке аутентификации:', error);
        openProfileModal();
    }
}


function openProfileModal() {
    modalP.classList.add('active');
    document.body.style.overflow = 'hidden';
    resetProfileSteps();
}

function closeProfileModal() {
    modalP.classList.remove('active');
    document.body.style.overflow = '';
    resetProfileSteps();
}

/* ---------- Переключение шагов ---------- */
function showProfileStep(el) {
    modalP.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    if (el === codeFormP) setupProfileCodeBoxes();
}

function resetProfileSteps() {
    clearProfileTimers();
    smsFormP.reset();
    codeFormP.reset();
    codeBoxesP.forEach(box => box.value = '');
    showProfileStep(smsFormP);
    msg1P.textContent = '';
    msg2P.textContent = '';
}

/* ---------- Отправка номера ---------- */
smsFormP.addEventListener('submit', e => {
    e.preventDefault();
    currentPhoneP = phoneInpP.value.replace(/\D/g, '');

    if (currentPhoneP.length !== 11 || !currentPhoneP.startsWith('7')) {
        msg1P.textContent = 'Введите правильный номер в формате +7...';
        msg1P.classList.add('error');
        return;
    }

    sendProfileCode('sms');
});

function sendProfileCode(method = 'sms') {
    clearProfileTimers();

    msg1P.textContent = 'Отправка...';
    msg1P.className = 'message';
    msg2P.textContent = '';
    msg2P.className = 'message';

    const fd = new FormData();
    fd.append('phone', currentPhoneP);
    fd.append('method', method);

    fetch('send_sms.php', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(d => {
            if (d.success) {
                showProfileStep(codeFormP);

                if (method === 'sms') {
                    startProfileCallTimer();
                }

            } else {
                // Если номер не зарегистрирован
                if (d.error && d.error.includes('не зарегистрирован')) {
                    showProfileStep(notRegP);
                } else {
                    msg1P.textContent = 'Ошибка: ' + (d.error || 'Неизвестная ошибка');
                    msg1P.classList.add('error');
                }
            }
        })
        .catch(() => {
            msg1P.textContent = 'Ошибка сети';
            msg1P.classList.add('error');
        });
}

/* ---------- Код (4 цифры) ---------- */
function setupProfileCodeBoxes() {
    codeBoxesP.forEach((b, i) => {
        b.value = '';
        b.oninput = () => {
            b.value = b.value.replace(/\D/g, '');
            if (b.value && i < 3) codeBoxesP[i + 1].focus();
            hiddenCodeP.value = [...codeBoxesP].map(x => x.value).join('');
        };
        b.onkeydown = e => {
            if (e.key === 'Backspace' && !b.value && i > 0) codeBoxesP[i - 1].focus();
        };
    });
    codeBoxesP[0].focus();
}

codeFormP.addEventListener('submit', e => {
    e.preventDefault();
    const code = hiddenCodeP.value.trim();

    if (code.length !== 4) {
        msg2P.textContent = 'Введите 4 цифры кода';
        msg2P.classList.add('error');
        return;
    }

    msg2P.textContent = 'Проверка...';
    msg2P.className = 'message';

    const fd = new FormData();
    fd.append('phone', currentPhoneP);
    fd.append('code', code);

    fetch('verify_code.php', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(d => {
            if (d.success) {
                msg2P.textContent = 'Успешно! Перенаправляем...';
                msg2P.classList.add('success');
                sessionStorage.setItem('authenticated_phone_client', currentPhoneP);
                sessionStorage.setItem('isLoggedIn_client', 'true'); // Опциональный флаг для JS-логики
                closeProfileModal();
                // Перенаправление в личный кабинет после успешной авторизации
                setTimeout(() => {
                    window.location.href = 'lk.html';
                }, 1500);

            } else {
                msg2P.textContent = 'Ошибка: ' + (d.error || 'Неверный код или время истекло'); // ИЗМЕНЕНО: Добавлена обработка случая, если d.error пусто
                msg2P.classList.add('error');
            }
        })
        .catch(() => {
            msg2P.textContent = 'Ошибка сети';
            msg2P.classList.add('error');
        });
});

/* ---------- Таймеры ---------- */
function startProfileCallTimer() {
    let s = 15;//ТАЙМЕР ДО ЗВОНКА, ДЛЯ ТЕСТОВ, СТАВИТЬ 120 СЕК 

    callTimerP = setInterval(() => {
        s--;
        if (s <= 0) {
            clearInterval(callTimerP);
            sendProfileCode('call'); // автоматический звонок
        }
    }, 1000);
}

function clearProfileTimers() {
    if (resendTimerP) clearInterval(resendTimerP);
    if (callTimerP) clearInterval(callTimerP);
}