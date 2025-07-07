
const periodBtn  = document.getElementById('periodBtn');
const periodText = document.getElementById('periodText');
const totalText  = document.getElementById('totalText');
const menu       = document.getElementById('periodMenu');
const closeBtn   = document.getElementById('menuClose');

/* открыть / закрыть меню */
periodBtn.onclick = ()=> menu.style.display='flex';
closeBtn .onclick = ()=> menu.style.display='none';

menu.querySelectorAll('.option').forEach(opt => {
  opt.onclick = () => {
    menu.querySelector('.active').classList.remove('active');
    opt.classList.add('active');
    periodText.innerHTML = opt.innerHTML;

    const months = +opt.dataset.value;
    const total = months === 6 ? 6667 :
                  months === 4 ? 10000 : 15000;
    totalText.textContent = total.toLocaleString('ru-RU') + '₽/месяц';

    menu.style.display = 'none';
  };
});
