let paymentIntegrationInstance;
let tinkoffIframeInstance;
const IFRAME_INTEGRATION_NAME = 'tinkoff-custom-iframe';
// Функция, которая вызывается, когда модуль интеграции Т-Банка загрузится!
function onPaymentIntegrationLoad() {
    console.log('T-Bank PaymentIntegration module loaded.');
    const terminalKey = '1748429891053DEMO'; // TerminalKey из скрипта tbankinitpay.php!
    const initConfig = {
        terminalKey: terminalKey,
        product: 'eacq',
        features: {
            payment: {},
            iframe: {}
        }
    };
    PaymentIntegration.init(initConfig)
        .then(async integration => { // Для удобства в create процесс будет асинхронным!
            paymentIntegrationInstance = integration;

            console.log('T-Bank PaymentIntegration initialized successfully.', integration);
            try {// Экземпляр создаваемый под iframe-интеграции заранее. Форма еще не отображается, только лишь создаётся объект для управления!
                tinkoffIframeInstance = await paymentIntegrationInstance.iframe.create(IFRAME_INTEGRATION_NAME, {
                    onSuccess: function(paymentData) {
                        console.log('Платеж успешно завершен:', paymentData);
                        alert('Платеж успешно завершен!');
                        document.getElementById('tinkoff-iframe-container').style.display = 'none'; // Скрыть iframe!
                        document.getElementById('tinkoff-iframe-container').innerHTML = ''; // Очистить!

                        if (typeof fetchBalanceData === 'function') {
                            fetchBalanceData();
                        }
                    },
                    onFail: function(paymentData) {
                        console.error('Ошибка платежа:', paymentData);
                        alert('Произошла ошибка при оплате. Пожалуйста, попробуйте снова.');
                        document.getElementById('tinkoff-iframe-container').style.display = 'none';
                        document.getElementById('tinkoff-iframe-container').innerHTML = '';
                    },
                    onClose: function(paymentData) {
                        console.log('Форма оплаты закрыта:', paymentData);
                        document.getElementById('tinkoff-iframe-container').style.display = 'none';
                        document.getElementById('tinkoff-iframe-container').innerHTML = '';
                    }
                });
                console.log('Tinkoff iframe instance created:', tinkoffIframeInstance);
                setupTinkoffPaymentButton();
            } catch (createError) {
                console.error('Ошибка при создании экземпляра iframe-интеграции:', createError);
                alert('Не удалось создать объект платежной формы Т-Банка.');
            }
        })
        .catch(error => {
            console.error('Ошибка инициализации T-Bank PaymentIntegration:', error);
            alert('Не удалось инициализировать платежный модуль Т-Банка.');
        });
}
async function setupTinkoffPaymentButton() {
    const tinkoffPaymentItem = document.getElementById('tinkoff-payment-item');
    const iframeContainer = document.getElementById('tinkoff-iframe-container');
    const paymentAmountInput = document.getElementById('payment-input-amount');

    if (tinkoffPaymentItem && iframeContainer && paymentAmountInput) {
        tinkoffPaymentItem.addEventListener('click', async () => {

            if (!paymentIntegrationInstance || !tinkoffIframeInstance) {
                console.error('PaymentIntegration or iframe instance not initialized yet.');
                alert('Модуль оплаты еще не готов. Пожалуйста, подождите или обновите страницу.');
                return;
            }// Получение суммы из поля ввода!
            let amountRub = parseFloat(paymentAmountInput.value);

            if (isNaN(amountRub) || amountRub <= 0) {
                alert('Пожалуйста, введите корректную сумму для оплаты.');
                return;
            }
            // Сумма для Т-Банка должна быть в копейках (целое число)!
            const amountKopecks = Math.round(amountRub * 100);
            iframeContainer.style.display = 'none';
            iframeContainer.innerHTML = '';
            try {
                const formData = new FormData();
                formData.append('amount', amountKopecks);
                const response = await fetch('tbankinitpay.php', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data.status === 'success') {// Монтирование iframe в контейнер с содержащимся полученным paymentUrl!
                    iframeContainer.style.display = 'block';
                    // mount() экземпляра iframe-интеграции!
                    await tinkoffIframeInstance.mount(iframeContainer, data.paymentUrl);
                    console.log('Tinkoff iframe mounted successfully.');

                } else {
                    console.error('Ошибка инициализации платежа от сервера:', data.message);
                    alert('Не удалось начать платеж: ' + data.message);
                }
            } catch (error) {
                console.error('Ошибка при запросе к tbankinitpay.php или монтировании iframe:', error);
                alert('Произошла системная ошибка. Пожалуйста, попробуйте позже.');
            }
        });
    } else {
        console.warn('Tinkoff payment item or iframe container not found in DOM.');
    }
}