const rentData = [
  {
    duration: '6 месяцев',
    tariff: 'Месяц',
    inventory: ['NB08K Kugoo Kirin V3 Pro (GPS)', 'NB07M Monster Pro']
  },
  {
    duration: '12 месяцев',
    tariff: 'Год',
    inventory: ['Xiaomi Mi Electric Scooter 3']
  }
];

function renderRent() {
  const container = document.getElementById('rent-columns');
  container.innerHTML = '';

  rentData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'rent-card';

    // Длительность
    const durationLabel = document.createElement('div');
    durationLabel.className = 'rent-label';
    durationLabel.textContent = 'Длительность:';
    const durationValue = document.createElement('div');
    durationValue.className = 'rent-pill';
    durationValue.textContent = item.duration;

    // Тариф
    const tariffLabel = document.createElement('div');
    tariffLabel.className = 'rent-label';
    tariffLabel.textContent = 'Тариф:';
    const tariffValue = document.createElement('div');
    tariffValue.className = 'rent-pill';
    tariffValue.textContent = item.tariff;

    // Инвентарь
    const inventoryLabel = document.createElement('div');
    inventoryLabel.className = 'rent-label';
    inventoryLabel.textContent = 'Арендованный инвентарь:';

    card.appendChild(durationLabel);
    card.appendChild(durationValue);
    card.appendChild(tariffLabel);
    card.appendChild(tariffValue);
    card.appendChild(inventoryLabel);

    item.inventory.forEach(inventoryItem => {
      const inventoryValue = document.createElement('div');
      inventoryValue.className = 'rent-pill';
      inventoryValue.textContent = inventoryItem;
      card.appendChild(inventoryValue);
    });

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', renderRent);
