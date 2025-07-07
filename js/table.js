
/* ---------- ИНИЦИАЛИЗАЦИЯ ---------- */
const modal   = document.getElementById('lead-modal');
const overlay = modal.querySelector('.lead-overlay');
const closeBt = modal.querySelector('.lead-close');
const form    = document.getElementById('leadForm');
const sourceF = document.getElementById('leadSource');

/* --- открытие по любой кнопке с data-lead="..." --- */
document.querySelectorAll('[data-lead]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    sourceF.value = btn.dataset.lead;   // метка в hidden‑поле
    modal.classList.add('active');
    document.body.style.overflow='hidden';
  });
});

/* --- закрытие --- */
[overlay, closeBt].forEach(el=>el.onclick = closeModal);
function closeModal(){
  modal.classList.remove('active');
  document.body.style.overflow='';
  form.reset();
}

/* --- отправка (пример) --- */
form.addEventListener('submit', e=>{
  e.preventDefault();
  const fd = new FormData(form);

  /* TODO: заменишь URL и логику на свою — в sheets / админку */
  fetch('send_lead.php', {method:'POST', body:fd})
    .then(r=>r.json())
    .then(d=>{
      alert('Спасибо! Мы свяжемся с вами.');   // заглушка
      closeModal();
    })
    .catch(()=>alert('Ошибка сети, попробуйте ещё раз'));
});
