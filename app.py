import asyncio
import logging
import json
import threading
from datetime import datetime, date
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from dateutil import parser
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
import uvicorn
from asgiref.wsgi import WsgiToAsgi

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/samandarlev/Desktop/tapgo_request-site/app.log'),
        logging.StreamHandler()
    ]
)
logging.info("Приложение запущено")

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bookings.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Конфигурация Telegram
TELEGRAM_BOT_TOKEN = '7630314423:AAH8prs6e7cXSd6a68YT7kGIhCc_r5_FXYQ'  # Замените на токен от BotFather
bot = Bot(token=TELEGRAM_BOT_TOKEN)
dp = Dispatcher()
telegram_chat_ids = set()
message_queue = asyncio.Queue()

# Глобальный событийный цикл
main_loop = asyncio.get_event_loop()

# Модель Booking
class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_type = db.Column(db.String(50), nullable=False)
    entertainment_center = db.Column(db.String(200), nullable=False)
    date_time = db.Column(db.DateTime, nullable=False)
    children_count = db.Column(db.Integer, nullable=False)
    children_cost = db.Column(db.Integer, nullable=False)
    food_included = db.Column(db.Boolean, nullable=False)
    food_items = db.Column(db.Text, nullable=True)
    services_included = db.Column(db.Boolean, nullable=False)
    services_items = db.Column(db.Text, nullable=True)
    transport_included = db.Column(db.Boolean, nullable=False)
    transport_type = db.Column(db.String(100), nullable=True)
    transport_cost = db.Column(db.Integer, nullable=True)
    total = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='active')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

# Создание базы данных
try:
    with app.app_context():
        db.create_all()
        logging.info("База данных bookings.db создана или уже существует")
except Exception as e:
    logging.error(f"Ошибка создания базы данных: {str(e)}")
    raise

# Обработчик очереди сообщений
async def process_message_queue():
    while True:
        booking = await message_queue.get()
        try:
            await send_telegram_message(booking)
        except Exception as e:
            logging.error(f"Ошибка обработки очереди для заявки #{booking.id}: {str(e)}")
        message_queue.task_done()

# Aiogram: обработчик /start
@dp.message(CommandStart())
async def start(message: types.Message):
    chat_id = message.chat.id
    telegram_chat_ids.add(chat_id)
    await message.answer('Бот активирован! Вы будете получать уведомления о новых заявках.')
    logging.info(f'Добавлен chat_id: {chat_id}, текущие chat_ids: {telegram_chat_ids}')

# Отправка сообщения во все чаты
async def send_telegram_message(booking):
    if not telegram_chat_ids:
        logging.warning("Нет chat_id для отправки сообщений")
        return

    try:
        food_items = json.loads(booking.food_items) if booking.food_items else []
        services_items = json.loads(booking.services_items) if booking.services_items else []
        
        message = (
            f"📅 *Новая заявка (# {booking.id})*\n\n"
            f"📌 *Тип бронирования*: {booking.booking_type}\n"
            f"🏬 *Центр*: {booking.entertainment_center}\n"
            f"🕒 *Дата и время*: {booking.date_time.strftime('%d.%m.%Y %H:%M')}\n"
            f"👶 *Дети*: {booking.children_count} (стоимость: {booking.children_cost} тг)\n"
            f"🍕 *Питание*: {'Включено' if booking.food_included else 'Не включено'}\n"
        )
        if food_items:
            message += "  - " + "\n  - ".join([f"{item['name']} ({item['price']} тг x {item['quantity']})" for item in food_items]) + "\n"
        
        message += f"🎭 *Услуги*: {'Включено' if booking.services_included else 'Не включено'}\n"
        if services_items:
            message += "  - " + "\n  - ".join([f"{item['name']} ({item['price']} тг)" for item in services_items]) + "\n"
        
        message += f"🚗 *Транспорт*: {'Включено' if booking.transport_included else 'Не включено'}\n"
        if booking.transport_included and booking.transport_type:
            message += f"  - {booking.transport_type} ({booking.transport_cost} тг)\n"
        
        message += (
            f"💸 *Итого*: {booking.total} тг\n"
            f"📈 *Статус*: {booking.status}\n"
        )
        
        for chat_id in telegram_chat_ids:
            try:
                await bot.send_message(chat_id=chat_id, text=message, parse_mode='Markdown')
                logging.info(f"Сообщение отправлено в chat_id: {chat_id} для заявки #{booking.id}")
            except Exception as e:
                logging.error(f"Ошибка отправки в chat_id {chat_id} для заявки #{booking.id}: {str(e)}")
    except Exception as e:
        logging.error(f"Ошибка формирования сообщения для заявки #{booking.id}: {str(e)}")


# Маршруты Flask
@app.route('/')
def home():
    logging.info("Запрошен маршрут /")
    return render_template('index.html')

@app.route('/about')
def about():
    logging.info("Запрошен маршрут /about")
    return render_template('about.html')

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    logging.info("Получен POST-запрос на /api/bookings")
    try:
        data = request.get_json()
        logging.info(f"Полученные данные: {data}")
        if not data:
            logging.warning("Неверный формат данных")
            return jsonify({'message': 'Неверный формат данных'}), 400

        required_fields = ['booking_type', 'entertainment_center', 'date_time', 'children', 'food', 'services', 'transport', 'total']
        if not all(field in data for field in required_fields):
            logging.warning(f"Отсутствуют обязательные поля: {required_fields}")
            return jsonify({'message': 'Отсутствуют обязательные поля'}), 400

        if not data['date_time'] or data['date_time'].strip() == '':
            logging.warning("Поле date_time пустое")
            return jsonify({'message': 'Поле даты не может быть пустым'}), 400

        try:
            date_time = parser.parse(data['date_time'], dayfirst=True)
            today = datetime.now().date()
            if date_time.date() <= today:
                logging.warning("Дата в прошлом или сегодня")
                return jsonify({'message': 'Дата должна быть в будущем'}), 400
        except ValueError:
            logging.warning(f"Неверный формат даты: {data['date_time']}")
            return jsonify({'message': f'Неверный формат даты: {data["date_time"]}'}), 400

        if data['children']['count'] <= 0:
            logging.warning("Количество детей должно быть больше 0")
            return jsonify({'message': 'Количество детей должно быть больше 0'}), 400

        if data['total'] <= 0:
            logging.warning("Общая сумма должна быть больше 0")
            return jsonify({'message': 'Общая сумма должна быть больше 0'}), 400

        booking = Booking(
            booking_type=data['booking_type'],
            entertainment_center=data['entertainment_center'],
            date_time=date_time,
            children_count=data['children']['count'],
            children_cost=data['children']['cost'],
            food_included=data['food']['included'],
            food_items=json.dumps(data['food']['items']),
            services_included=data['services']['included'],
            services_items=json.dumps(data['services']['items']),
            transport_included=data['transport']['included'],
            transport_type=data['transport']['type'],
            transport_cost=data['transport']['cost'],
            total=data['total'],
            status='active'
        )

        db.session.add(booking)
        db.session.commit()
        logging.info(f"Заявка #{booking.id} сохранена в базе")

        # Добавление задачи в очередь через отдельный поток
        main_loop.call_soon_threadsafe(asyncio.create_task, message_queue.put(booking))

        return jsonify({'message': 'Заявка успешно создана', 'id': booking.id}), 201

    except Exception as e:
        db.session.rollback()
        logging.error(f"Ошибка при создании заявки: {str(e)}")
        return jsonify({'message': f'Ошибка сервера: {str(e)}'}), 500

@app.route('/test_booking')
def test_booking():
    logging.info("Запрошен тестовый маршрут /test_booking")
    try:
        booking = Booking(
            booking_type='Тест',
            entertainment_center='Funky Town',
            date_time=datetime(2025, 5, 14, 14, 30),
            children_count=5,
            children_cost=7500,
            food_included=True,
            food_items=json.dumps([{'name': 'Пицца', 'price': 5000, 'quantity': 10}]),
            services_included=True,
            services_items=json.dumps([{'name': 'Аквагрим', 'price': 10000}]),
            transport_included=True,
            transport_type='Туда-обратно',
            transport_cost=10000,
            total=67500,
            status='active'
        )
        db.session.add(booking)
        db.session.commit()
        logging.info(f"Тестовая заявка #{booking.id} создана")

        # Добавление задачи в очередь через отдельный поток
        main_loop.call_soon_threadsafe(asyncio.create_task, message_queue.put(booking))

        return 'Тестовая заявка создана'
    except Exception as e:
        db.session.rollback()
        logging.error(f"Ошибка тестовой заявки: {str(e)}")
        return f'Ошибка: {str(e)}'

# Асинхронная функция для запуска бота и сервера
async def main():
    try:
        # Сброс вебхуков и запуск Telegram-бота
        await bot.delete_webhook(drop_pending_updates=True)
        bot_task = asyncio.create_task(dp.start_polling(bot, drop_pending_updates=True))
        queue_task = asyncio.create_task(process_message_queue())
        logging.info("Telegram-бот и обработчик очереди запущены")
        
        # Запуск Flask через uvicorn с адаптером WsgiToAsgi
        asgi_app = WsgiToAsgi(app)
        config = uvicorn.Config(asgi_app, host="127.0.0.1", port=5000, log_level="info")
        server = uvicorn.Server(config)
        await server.serve()
        
    except Exception as e:
        logging.error(f"Ошибка в main: {str(e)}")
        raise

if __name__ == '__main__':
    asyncio.run(main())

