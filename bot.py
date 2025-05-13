import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.enums import ParseMode
from aiogram.types import Message
from aiogram.client.default import DefaultBotProperties  # добавлено

API_TOKEN = '7630314423:AAH8prs6e7cXSd6a68YT7kGIhCc_r5_FXYQ'

bot = Bot(
    token=API_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)  # исправлено
)
dp = Dispatcher()

@dp.message()
async def handle_message(message: Message):
    await message.answer(f"Вы сказали: {message.text}")

async def main():
    print("Бот запущен")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
