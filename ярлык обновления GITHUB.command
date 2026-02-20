#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Начинаю деплой..."
echo ""

git add .

echo "💬 Введите описание изменений (Enter = 'Обновление'):"
read commit_message

if [ -z "$commit_message" ]; then
    commit_message="Обновление $(date '+%Y-%m-%d %H:%M')"
fi

echo "✅ Коммит: $commit_message"
git commit -m "$commit_message"

echo "📤 Отправка на GitHub..."
git push

echo "🌐 Публикация на GitHub Pages..."
npm run deploy

echo ""
echo "✨ Готово! Сайт: https://artemasovvalera.github.io/y_s/"
echo ""
read -p "Нажмите Enter для выхода..."
