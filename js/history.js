/* ========= history.js ========= */

const MAX_PER_COLUMN = 7;   // 7 записей в колонку
const MAX_VISIBLE    = 14;  // всего выводим не больше 14

/* Тестовые данные */
const historyData = [
  { amount: '+11 000 ₽', date: '25.07.2025' },
    { amount: '+11 000 ₽', date: '25.07.2025' },
  { amount: '+10 000 ₽', date: '25.07.2025' },
  { amount: '+10 000 ₽', date: '25.07.2025' },
  { amount: '+10 000 ₽', date: '25.07.2025' },
  { amount: '+10 000 ₽', date: '25.07.2024' },
  { amount: '-15 000 ₽', date: '24.07.2024' },
  { amount: '-15 000 ₽', date: '23.07.2024' },
  { amount: '+10 000 ₽', date: '22.07.2024' },
  { amount: '+10 000 ₽', date: '21.07.2024' },
  { amount: '-15 000 ₽', date: '20.07.2024' },
  { amount: '-15 000 ₽', date: '19.07.2024' },
  { amount: '+10 000 ₽', date: '18.07.2024' },
  { amount: '-15 000 ₽', date: '17.07.2024' },
  { amount: '-15 000 ₽', date: '16.07.2024' }
];

function createRow({amount, date}) {
  const li = document.createElement('li');
  li.className = 'history-row';

  const sum = document.createElement('div');
  sum.className = 'history-amount ' + (amount.trim().startsWith('+') ? 'plus' : 'minus');
  sum.textContent = amount;

  const d = document.createElement('div');
  d.className = 'history-date';
  d.textContent = date;

  li.append(sum, d);
  return li;
}

function renderHistory() {
  const left  = document.getElementById('history-left');
  const right = document.getElementById('history-right');
  if (!left || !right) return;

  left.innerHTML = right.innerHTML = '';          // чистим

  historyData.slice(0, MAX_VISIBLE).forEach((rec, idx) => {
    (idx < MAX_PER_COLUMN ? left : right).appendChild(createRow(rec));
  });
}

document.addEventListener('DOMContentLoaded', renderHistory);
