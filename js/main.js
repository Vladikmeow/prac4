
document.addEventListener('DOMContentLoaded', async () => {
  /* профиль ----------------------------------------------------------- */
  try {
    const profile = await fetchJSON('/api/profile.php');      // {account_id, full_name, address, phone, email}
    if (profile) updateProfile(profile);
  } catch (e) { console.error('profile', e); }

  /* баланс ------------------------------------------------------------ */
  try {
    const { amount } = await fetchJSON('/api/balance.php');   // {amount: 12345}
    if (amount !== undefined) {
      document.getElementById('balance-value').textContent = `${amount} ₽`;
    }
  } catch (e) { console.error('balance', e); }

  /* история начислений ----------------------------------------------- */
  try {
    const history = await fetchJSON('/api/history.php');      // [{amount:'+1000 ₽', date:'2024‑07‑26'}, …]
    if (history?.length) renderHistory(history);
  } catch (e) { console.error('history', e); }

  /* аренды ------------------------------------------------------------ */
  try {
    const rent = await fetchJSON('/api/rent.php');            // [{duration:'6 месяцев', tariff:'Месяц', items:['…','…']}, …]
    if (rent?.length) renderRent(rent);
  } catch (e) { console.error('rent', e); }
});

/* ---------- helpers ------------------------------------------------- */
async function fetchJSON(url) {
  const r = await fetch(url, { credentials: 'include' }); //сессия
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

/* ---------- отрисовка профиля --------------------------------------- */
function updateProfile(p) {
  document.querySelector('[data-field="account_id"]').textContent = p.account_id;
  document.querySelector('[data-field="full_name"]').textContent  = p.full_name;
  document.querySelector('[data-field="address"]').textContent    = p.address;
  document.querySelector('[data-field="phone"]').textContent      = p.phone;
  document.querySelector('[data-field="email"]').textContent      = p.email;
}

/* ---------- история -------------------------------------------------- */
function renderHistory(arr) {
  const left  = document.getElementById('history-left');
  const right = document.getElementById('history-right');
  [left, right].forEach(c => c.innerHTML = '');             // очистка

  arr.slice(0,14).forEach((row, i) => {                     // максимум 14 строк (7+7) у меня по дизайну там по 7 строк в столбце
    const li = document.createElement('li');
    li.className = 'history-row';
    li.innerHTML = `
      <div class="history-amount ${row.amount.startsWith('+') ? 'plus' : 'minus'}">
        ${row.amount}
      </div>
      <div class="history-date">${row.date}</div>`;
    (i < 7 ? left : right).appendChild(li);
  });
}

/* ---------- аренда --------------------------------------------------- */
function renderRent(list) {
  const wrap = document.getElementById('rent-block');
  wrap.innerHTML = '';

  list.forEach(r => {
    const col = document.createElement('div');
    col.className = 'rent-column';
    col.innerHTML = `
      <div class="rent-label">Длительность:</div>
      <div class="rent-pill">${r.duration}</div>
      <div class="rent-label">Тариф:</div>
      <div class="rent-pill">${r.tariff}</div>
      <div class="rent-label">Арендованный инвентарь:</div>` +
      r.items.map(it => `<div class="rent-pill">${it}</div>`).join('');
    wrap.appendChild(col);
  });
}
