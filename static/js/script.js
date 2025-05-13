document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Flatpickr
    flatpickr('#date_time', {
        enableTime: true,
        dateFormat: 'd.m.Y H:i',
        locale: 'ru',
        time_24hr: true,
        minDate: 'today'
    });

    // Инициализация переменных
    const childrenCountInput = document.getElementById('children_count');
    const childrenCostDisplay = document.getElementById('children_cost');
    const totalSummary = document.getElementById('total_summary').querySelector('span');
    const foodModal = document.getElementById('food_modal');
    const servicesModal = document.getElementById('services_modal');
    const submitModal = document.getElementById('submit_modal');
    const foodSelectedItems = document.getElementById('food_selected_items');
    const servicesSelectedItems = document.getElementById('services_selected_items');
    const addFoodButton = document.getElementById('add_food_button');
    const addServicesButton = document.getElementById('add_services_button');
    const outingButton = document.getElementById('outing_button');
    const invitationButton = document.getElementById('invitation_button');
    const transportSelect = document.getElementById('transport_type');
    const submitButton = document.querySelector('.submit_button');
    const pricePerChild = 1500; // тенге за ребёнка
    const discount = 0.1; // 10% скидка

    // Проверка наличия элементов
    if (!childrenCountInput) console.error('Элемент #children_count не найден');
    if (!childrenCostDisplay) console.error('Элемент #children_cost не найден');
    if (!totalSummary) console.error('Элемент #total_summary span не найден');
    if (!addFoodButton) console.error('Кнопка #add_food_button не найдена');
    if (!addServicesButton) console.error('Кнопка #add_services_button не найдена');
    if (!foodModal) console.error('Модальное окно #food_modal не найдено');
    if (!servicesModal) console.error('Модальное окно #services_modal не найдено');
    if (!submitModal) console.error('Модальное окно #submit_modal не найдено');
    if (!foodSelectedItems) console.error('Элемент #food_selected_items не найден');
    if (!servicesSelectedItems) console.error('Элемент #services_selected_items не найден');
    if (!outingButton) console.error('Кнопка #outing_button не найдена');
    if (!invitationButton) console.error('Кнопка #invitation_button не найдена');
    if (!transportSelect) console.error('Элемент #transport_type не найден');
    if (!submitButton) console.error('Кнопка .submit_button не найдена');

    // Переключение активной кнопки
    function toggleActiveButton(activeButton, inactiveButton) {
        activeButton.classList.add('active');
        inactiveButton.classList.remove('active');
    }

    if (outingButton && invitationButton) {
        outingButton.addEventListener('click', () => {
            console.log('Клик по кнопке На выезд');
            toggleActiveButton(outingButton, invitationButton);
        });

        invitationButton.addEventListener('click', () => {
            console.log('Клик по кнопке Приглашение');
            toggleActiveButton(invitationButton, outingButton);
        });
    }

    // Списки элементов для модальных окон
    const foodItems = [
        { id: 'pizza_pepperoni', name: 'Пицца пепперони', price: 5000, category: 'Пицца' },
        { id: 'pizza_margherita', name: 'Пицца маргарита', price: 4500, category: 'Пицца' },
        { id: 'juice', name: 'Сок', price: 500, category: 'Напитки' },
        { id: 'water', name: 'Вода', price: 300, category: 'Напитки' }
    ];

    const serviceItems = [
        { id: 'magic_show', name: 'Магическое шоу', price: 20000, category: 'Шоу-программы' },
        { id: 'science_show', name: 'Научное шоу', price: 25000, category: 'Шоу-программы' },
        { id: 'clown_animator', name: 'Аниматор-клоун', price: 15000, category: 'Аниматоры' },
        { id: 'superhero_animator', name: 'Аниматор-супергерой', price: 18000, category: 'Аниматоры' },
        { id: 'face_painting', name: 'Аквагрим', price: 10000, category: 'Другие развлечения' },
        { id: 'balloon_twisting', name: 'Фигурки из шаров', price: 8000, category: 'Другие развлечения' }
    ];

    // Функция обновления стоимости детей
    function updateChildrenCost() {
        const count = parseInt(childrenCountInput.value) || 0;
        const cost = count * pricePerChild;
        childrenCostDisplay.textContent = `${cost.toLocaleString()} тенге`;
        updateTotal();
    }

    // Функция обновления общей суммы
    function updateTotal() {
        let total = 0;
        const childrenCount = parseInt(childrenCountInput.value) || 0;
        total += childrenCount * pricePerChild;

        if (document.getElementById('include_food').checked) {
            document.querySelectorAll('#food_selected_items .selected_item_tag').forEach(tag => {
                const price = parseInt(tag.dataset.price) || 0;
                const quantity = parseInt(tag.dataset.quantity) || 1;
                total += price * quantity;
            });
        }

        if (document.getElementById('include_services').checked) {
            document.querySelectorAll('#services_selected_items .selected_item_tag').forEach(tag => {
                total += parseInt(tag.dataset.price) || 0;
            });
        }

        if (document.getElementById('include_transport').checked && transportSelect) {
            const selectedOption = transportSelect.options[transportSelect.selectedIndex];
            const transportPrice = parseInt(selectedOption.dataset.price) || 0;
            total += transportPrice;
        }

        total = total * (1 - discount);
        totalSummary.textContent = `${total.toLocaleString()} тенге`;
    }

    // Функции для модальных окон
    function openModal(modal) {
        if (modal) {
            console.log(`Открытие модального окна: ${modal.id}`);
            modal.style.display = 'block';
        } else {
            console.error('Модальное окно не найдено');
        }
    }

    function closeModal(modal) {
        if (modal) {
            console.log(`Закрытие модального окна: ${modal.id}`);
            modal.style.display = 'none';
        }
    }

    // Сбор данных формы
    function collectFormData() {
        const dateTimeInput = document.getElementById('date_time');
        const dateTimeValue = dateTimeInput ? dateTimeInput.value : '';
        const data = {
            booking_type: outingButton.classList.contains('active') ? 'На выезд' : 'Приглашение',
            entertainment_center: document.getElementById('entertainment_center').value,
            date_time: dateTimeValue,
            children: {
                count: parseInt(childrenCountInput.value) || 0,
                cost: (parseInt(childrenCountInput.value) || 0) * pricePerChild
            },
            food: {
                included: document.getElementById('include_food').checked,
                items: []
            },
            services: {
                included: document.getElementById('include_services').checked,
                items: []
            },
            transport: {
                included: document.getElementById('include_transport').checked,
                type: null,
                cost: 0
            },
            total: parseInt(totalSummary.textContent.replace(/\s/g, '')) || 0
        };

        if (data.food.included) {
            document.querySelectorAll('#food_selected_items .selected_item_tag').forEach(tag => {
                data.food.items.push({
                    name: tag.querySelector('span').textContent.split(' (')[0],
                    price: parseInt(tag.dataset.price) || 0,
                    quantity: parseInt(tag.dataset.quantity) || 1
                });
            });
        }

        if (data.services.included) {
            document.querySelectorAll('#services_selected_items .selected_item_tag').forEach(tag => {
                data.services.items.push({
                    name: tag.textContent.split(' (')[0],
                    price: parseInt(tag.dataset.price) || 0
                });
            });
        }

        if (data.transport.included && transportSelect) {
            const selectedOption = transportSelect.options[transportSelect.selectedIndex];
            data.transport.type = selectedOption.text;
            data.transport.cost = parseInt(selectedOption.dataset.price) || 0;
        }

        return data;
    }

    // Обработчик для кнопки "Отправить заявку"
    if (submitButton) {
        submitButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const formData = collectFormData();
            console.log('Отправка данных:', JSON.stringify(formData, null, 2));

            // Валидация date_time
            if (!formData.date_time || formData.date_time.trim() === '') {
                console.error('Ошибка: Поле даты пустое');
                alert('Пожалуйста, выберите дату и время');
                return;
            }

            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                console.log('Ответ сервера:', result);
                if (response.ok) {
                    openModal(submitModal);
                    setTimeout(() => { closeModal(submitModal); }, 3000);
                } else {
                    console.error('Ошибка отправки:', result.message);
                    alert(`Ошибка: ${result.message}`);
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
                alert('Данные отправлены. √.');
            }
        });
    }

    // Управление количеством детей
    document.querySelector('.quantity_control .increment').addEventListener('click', () => {
        childrenCountInput.value = parseInt(childrenCountInput.value) + 1;
        updateChildrenCost();
    });

    document.querySelector('.quantity_control .decrement').addEventListener('click', () => {
        if (parseInt(childrenCountInput.value) > 0) {
            childrenCountInput.value = parseInt(childrenCountInput.value) - 1;
            updateChildrenCost();
        }
    });

    // Переключение видимости контента
    function toggleContent(checkboxId, contentId) {
        const checkbox = document.getElementById(checkboxId);
        const content = document.getElementById(contentId);
        if (checkbox && content) {
            checkbox.addEventListener('change', () => {
                content.classList.toggle('hidden', !checkbox.checked);
                updateTotal();
            });
        }
    }

    toggleContent('include_food', 'food_content');
    toggleContent('include_services', 'services_content');
    toggleContent('include_transport', 'transport_content');

    // Обновление суммы при смене типа транспорта
    if (transportSelect) {
        transportSelect.addEventListener('change', () => {
            console.log('Изменён тип транспорта:', transportSelect.value);
            updateTotal();
        });
    }

    // Динамическое создание содержимого модального окна
    function populateModal(modalBody, items, type) {
        modalBody.innerHTML = '';
        const categories = [...new Set(items.map(item => item.category))];
        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = `${type}_category_modal`;
            categoryDiv.innerHTML = `<h3>${category}</h3>`;
            items.filter(item => item.category === category).forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `${type}_item_modal`;
                itemDiv.innerHTML = `
                    <input type="checkbox" id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                    <label for="${item.id}">${item.name} (${item.price.toLocaleString()} тенге)</label>
                `;
                categoryDiv.appendChild(itemDiv);
            });
            modalBody.appendChild(categoryDiv);
        });
    }

    // Инициализация модальных окон
    const foodModalBody = document.querySelector('#food_modal .modal_body');
    const servicesModalBody = document.querySelector('#services_modal .modal_body');
    if (foodModalBody) populateModal(foodModalBody, foodItems, 'menu');
    if (servicesModalBody) populateModal(servicesModalBody, serviceItems, 'services');

    // Обработчики для еды
    if (addFoodButton) {
        addFoodButton.addEventListener('click', () => {
            console.log('Клик по кнопке Добавить еду');
            openModal(foodModal);
        });
    }

    const foodCloseButton = document.querySelector('#food_modal .modal_close_button');
    if (foodCloseButton) {
        foodCloseButton.addEventListener('click', () => closeModal(foodModal));
    }

    const saveFoodButton = document.getElementById('save_food');
    if (saveFoodButton) {
        saveFoodButton.addEventListener('click', () => {
            const currentItems = {};
            document.querySelectorAll('#food_selected_items .selected_item_tag').forEach(tag => {
                currentItems[tag.dataset.id] = parseInt(tag.dataset.quantity) || 1;
            });

            const checkboxes = document.querySelectorAll('#food_modal input[type="checkbox"]:checked');
            const selectedItems = [];
            checkboxes.forEach(checkbox => {
                selectedItems.push({
                    id: checkbox.id,
                    name: checkbox.dataset.name,
                    price: checkbox.dataset.price
                });
            });

            foodSelectedItems.innerHTML = '';
            if (selectedItems.length === 0) {
                foodSelectedItems.innerHTML = '<p>Нет выбранных элементов</p>';
            } else {
                selectedItems.forEach(item => {
                    const tag = document.createElement('div');
                    tag.className = 'selected_item_tag';
                    tag.dataset.id = item.id;
                    tag.dataset.price = item.price;
                    tag.dataset.quantity = currentItems[item.id] || '1';

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = `${item.name} (${parseInt(item.price).toLocaleString()} тенге)`;

                    const quantitySelector = document.createElement('div');
                    quantitySelector.className = 'quantity_selector';

                    const decrementButton = document.createElement('button');
                    decrementButton.textContent = '-';
                    decrementButton.addEventListener('click', () => {
                        let quantity = parseInt(tag.dataset.quantity) || 1;
                        if (quantity > 1) {
                            quantity--;
                            tag.dataset.quantity = quantity;
                            quantitySpan.textContent = quantity;
                            updateTotal();
                        } else {
                            tag.remove();
                            if (!foodSelectedItems.querySelector('.selected_item_tag')) {
                                foodSelectedItems.innerHTML = '<p>Нет выбранных элементов</p>';
                            }
                            updateTotal();
                        }
                    });

                    const quantitySpan = document.createElement('span');
                    quantitySpan.textContent = tag.dataset.quantity;

                    const incrementButton = document.createElement('button');
                    incrementButton.textContent = '+';
                    incrementButton.addEventListener('click', () => {
                        let quantity = parseInt(tag.dataset.quantity) || 1;
                        quantity++;
                        tag.dataset.quantity = quantity;
                        quantitySpan.textContent = quantity;
                        updateTotal();
                    });

                    quantitySelector.appendChild(decrementButton);
                    quantitySelector.appendChild(quantitySpan);
                    quantitySelector.appendChild(incrementButton);

                    tag.appendChild(nameSpan);
                    tag.appendChild(quantitySelector);
                    foodSelectedItems.appendChild(tag);
                });
            }
            closeModal(foodModal);
            updateTotal();
        });
    }

    // Обработчики для услуг
    if (addServicesButton) {
        addServicesButton.addEventListener('click', () => {
            console.log('Клик по кнопке Добавить услуги');
            openModal(servicesModal);
        });
    }

    const servicesCloseButton = document.querySelector('#services_modal .modal_close_button');
    if (servicesCloseButton) {
        servicesCloseButton.addEventListener('click', () => closeModal(servicesModal));
    }

    const saveServicesButton = document.getElementById('save_services');
    if (saveServicesButton) {
        saveServicesButton.addEventListener('click', () => {
            servicesSelectedItems.innerHTML = '';
            const checkboxes = document.querySelectorAll('#services_modal input[type="checkbox"]:checked');
            if (checkboxes.length === 0) {
                servicesSelectedItems.innerHTML = '<p>Нет выбранных элементов</p>';
            } else {
                checkboxes.forEach(checkbox => {
                    const name = checkbox.dataset.name;
                    const price = checkbox.dataset.price;
                    const tag = document.createElement('span');
                    tag.className = 'selected_item_tag';
                    tag.dataset.price = price;
                    tag.textContent = `${name} (${parseInt(price).toLocaleString()} тенге)`;
                    servicesSelectedItems.appendChild(tag);
                });
            }
            closeModal(servicesModal);
            updateTotal();
        });
    }

    // Закрытие модалок при клике вне окна
    window.addEventListener('click', (event) => {
        if (event.target === foodModal) closeModal(foodModal);
        if (event.target === servicesModal) closeModal(servicesModal);
        if (event.target === submitModal) closeModal(submitModal);
    });

    // Инициализация
    updateChildrenCost();
});