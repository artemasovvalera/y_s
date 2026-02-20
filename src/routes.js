// src/routes.js

// 1. СЛОВАРИ И ПЕРЕВОДЫ
export const TRANSLATIONS = {
    ru: {
        app_name: "Я САМ",
        rec: "Рекомендации", cat: "Каталог", search: "Поиск", fav: "Избранное", map: "Карта",
        settings: "Настройки", city: "Выбор города", lang: "Язык", close: "Закрыть",
        completed: "Завершённые", account: "Аккаунт", contact: "Связаться", notif: "Уведомления",
        theme_light: "Светлая тема", theme_dark: "Тёмная тема", exit: "Выход",
        search_ph: "Поиск маршрутов...", nothing: "Ничего не найдено",
        steps: "шагов", dist: "км", min: "мин", audio: "Аудио", video: "Видео",
        map_btn: "Карта", about: "О месте", to_fav: "В избранное", visited: "Посещено",
        profile: "Ваш профиль", save: "Сохранить", cancel: "Отмена", change_photo: "Изменить фото",
        routes_done: "Маршрутов пройдено", rewards: "Наград получено",
        new: "Новое", ads: "Реклама", near: "Рядом с вами", empty_list: "Список пуст", // <--- ads добавлен
        download: "Скачать",
        audio_error: "Ошибка воспроизведения.",
        notif_permission_title: "Разрешите уведомления",
        notif_permission_text: "Мы будем уведомлять вас о:\n• Интересных маршрутах поблизости\n• Новых аудиогидах\n• Обновлениях приложения\n\nЭто поможет не пропустить ничего важного!",
        notif_allow: "Разрешить",
        notif_later: "Позже",
        city_kemerovo: "Кемерово", city_moscow: "Москва", city_yerevan: "Ереван", city_dusseldorf: "Дюссельдорф", city_arambol: "Арамболь",

        "Культурные и исторические маршруты": "Культурные и исторические",
        "Природные и активные маршруты": "Природные и активные",
        "Семейные маршруты": "Семейные",
        "Альтернативные маршруты": "Альтернативные",
        "Гастрономические маршруты": "Гастрономические",
        "Тематические маршруты": "Тематические",
        "Современные и урбанистические маршруты": "Современные и урбан",

        "Набережная": "Набережная", "Музеи и выставки": "Музеи и выставки", "Памятники и мемориалы": "Памятники",
        "Архитектурные достопримечательности": "Архитектура", "Городские площади": "Площади",
        "Исторические кварталы": "Кварталы", "Церкви и храмы": "Храмы", "Легенды и мифы города": "Легенды и мифы",

        "Природные зоны и парки": "Парки", "Горные и лесные маршруты": "Горы и лес",
        "Активный отдых у воды": "Отдых у воды", "Спортивные площадки и фитнес-парки": "Спорт и фитнес",

        "Скульптуры и уличное искусство": "Скульптуры и стрит-арт", "Современная архитектура": "Современная архитектура",
        "Городские лаборатории": "Городские лаборатории", "Реставрации и обновления": "Реставрации",

        "Кофе": "Кофе", "Уличная еда": "Уличная еда", "Традиционные рестораны": "Рестораны",
        "Гастрономические мастер-классы": "Мастер-классы",

        "Парки аттракционы и детские площадки": "Аттракционы", "Зоопарки": "Зоопарки",
        "Музеи для детей": "Детские музеи", "Пикники на природе": "Пикники",
        "Игровые центры и развлекательные зоны": "Игровые центры",

        "Заброшенные здания и территории": "Заброшенные места", "Урбанистические исследования": "Урбанистика",
        "Тайные и мистические маршруты": "Тайны и мистика", "Ночные экскурсии": "Ночные экскурсии",

        "Музыкальные маршруты": "Музыкальные", "Кино и телевидение": "Кино и ТВ",
        "Мифы и легенды": "Мифы и легенды", "Технические и инновационные маршруты": "Технологии",
        "Спортивные маршруты": "Спортивные",

        "Arambol Beach": "Пляж Арамболь", "Best beach in North Goa": "Лучший пляж северного ГОА", "Medium": "Средняя",
        "Baba Tree": "Большое баньяновое дерево и просвященный Баба", "Baba Description": "Место силы и медитации, где под огромным баньяном обитает Баба.", "High": "Высокая",
        "Arambol Rocks": "Скала Арамболь", "Rocks Description": "Лучшая локация для заката с потрясающим видом на океан.",
        "Red Square": "Красная Площадь", "Zaryadye": "Парк Зарядье", "Cascade": "Каскад", "Rheinturm": "Рейнская башня"
    },
    // ... (остальные языки можно оставить пустыми или скопировать если нужны, для краткости здесь RU)
    en: {}, de: {}, hy: {}, hi: {} 
};

// 2. СПИСОК ЯЗЫКОВ
export const LANGUAGES = [
    { code: 'ru', label: 'Русский', icon: '🇷🇺' },
    { code: 'de', label: 'Deutsch', icon: '🇩🇪' },
    { code: 'hy', label: 'Հայերեն', icon: '🇦🇲' },
    { code: 'en', label: 'English', icon: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', icon: '🇮🇳' },
];

// 3. ГОРОДА
export const CITIES = [
    { id: 'kemerovo', lat: 55.3533, lon: 86.0883 },
    { id: 'moscow', lat: 55.7558, lon: 37.6173 },
    { id: 'yerevan', lat: 40.1872, lon: 44.5152 },
    { id: 'dusseldorf', lat: 51.2277, lon: 6.7735 },
    { id: 'arambol', lat: 15.6861, lon: 73.7144 },
];

// 4. СТРУКТУРА КАТАЛОГА
export const CATALOG_STRUCTURE = {
    "Культурные и исторические маршруты": ["Набережная", "Музеи и выставки", "Памятники и мемориалы", "Архитектурные достопримечательности", "Городские площади", "Исторические кварталы", "Церкви и храмы", "Легенды и мифы города"],
    "Природные и активные маршруты": ["Природные зоны и парки", "Горные и лесные маршруты", "Активный отдых у воды", "Спортивные площадки и фитнес-парки"],
    "Современные и урбанистические маршруты": ["Скульптуры и уличное искусство", "Современная архитектура", "Городские лаборатории", "Реставрации и обновления"],
    "Гастрономические маршруты": ["Кофе", "Уличная еда", "Традиционные рестораны", "Гастрономические мастер-классы"],
    "Семейные маршруты": ["Парки аттракционы и детские площадки", "Зоопарки", "Музеи для детей", "Пикники на природе", "Игровые центры и развлекательные зоны"],
    "Альтернативные маршруты": ["Заброшенные здания и территории", "Урбанистические исследования", "Тайные и мистические маршруты", "Ночные экскурсии"],
    "Тематические маршруты": ["Музыкальные маршруты", "Кино и телевидение", "Мифы и легенды", "Технические и инновационные маршруты", "Спортивные маршруты"],
};

// 5. ГЛАВНАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ МАРШРУТОВ
export const getRoutesData = (cityId, lang) => {
    const t = (txt) => TRANSLATIONS[lang]?.[txt] || txt;

    // Скелет каталога
    const structure = JSON.parse(JSON.stringify(CATALOG_STRUCTURE)); // Глубокая копия ключей
    Object.keys(structure).forEach(key => {
        const subCats = structure[key];
        structure[key] = {};
        subCats.forEach(sub => structure[key][sub] = []);
    });

    // Наполнение данными
    if (cityId === 'kemerovo') {
        const pushkinRoute = { name: "Площадь и Памятник Пушкину", distance: 0.5, time: "5 мин", difficulty: "Лёгкая", videoUrl: "https://rutube.ru/video/39841ce0856abb688f35f07e6d06f474/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXRGla", audioUrl: "https://archive.org/download/20251028_20251028_0740/%D0%BF%D0%BB%D0%BE%D1%89%D0%B0%D0%B4%D1%8C%20%D0%BF%D1%83%D1%88%D0%BA%D0%B8%D0%BD%D0%B0.MP3", image: "https://archive.org/download/20251028_20251028_0740/IMG_20251028_130447.jpg", location: { lat: 55.357344, lon: 86.087308 }, descriptionShort: "Уютная площадь в центре города.", subCategory: "Городские площади" };
        const minerRoute = { name: "Память шахтёрам Кузбасса", distance: 1.5, time: "20 мин", difficulty: "Лёгкая", videoUrl: "https://rutube.ru/video/a296940a183cdc08d317c54345547175/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXRS8n", audioUrl: "https://archive.org/download/miner_202510/miner.MP3", image: "https://archive.org/download/miner_202510/7933c1ff3b8662e1762c21e13a75417f.jpg", location: { lat: 55.374074, lon: 86.078468 }, descriptionShort: "Монументальный памятник шахтёрам.", subCategory: "Памятники и мемориалы" };
        const importCoffeeRoute = { name: "Import Coffee", distance: 0.1, time: "5 мин", difficulty: "Очень лёгкая", videoUrl: "", geoUrl: "https://yandex.ru/maps/-/CLSXRDmw", audioUrl: "https://archive.org/download/20251029_20251029_1604/%D0%B8%D0%BC%D0%BF%D0%BE%D1%80%D1%82%D0%BA%D0%BE%D1%84%D0%B5.MP3", image: "https://archive.org/download/20251029_20251029_1604/caska-kapucino-s-kofe-v-zernah-na-stole.jpg", location: { lat: 55.358212, lon: 86.083722 }, descriptionShort: "Лучший кофе с видом на набережную.", subCategory: "Кофе" };
        const fiveFacts = { name: "5 фактов о Кемерово, о которых ты не знал",  distance: 0.5,  time: "10 мин",  difficulty: "Лёгкая",  geoUrl: "https://yandex.ru/maps/-/CLSXRGla", audioUrl: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/5fakt(1).MP3", videoUrl: "https://rutube.ru/video/52b6f916e4e102125400908a2a16c876/", image: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/5fakt.png", location: { lat: 55.354692, lon: 86.088503 }, descriptionShort: "Удивительные факты о городе, которые знают только местные.", subCategory: "Легенды и мифы города", isExploreRoute: true };
        const leninMemorialRoute = { name: "Памятник Ленину", distance: 1.2, time: "15 мин", difficulty: "Лёгкая", videoUrl: "https://rutube.ru/video/b617deb9362e1df28c969ae16db82226/", geoUrl: "https://yandex.ru/maps/-/CLSXRL1p", audioUrl: "https://archive.org/download/lenin_202511/Lenin.MP3", image: "https://archive.org/download/lenin_202511/Lenin.jpg", location: { lat: 55.354692, lon: 86.088503 }, descriptionShort: "Центральный памятник города.", subCategory: "Городские площади" };
        const oldestHouseRoute = { name: "Самый старый дом", distance: 0.8, time: "10 мин", difficulty: "Лёгкая", videoUrl: "https://rutube.ru/video/207c76befeba4aa49f13a0e052c3f21b/", geoUrl: "https://yandex.ru/maps/-/CLSXRXKJ", audioUrl: "https://archive.org/download/dom_20251106/dom.MP3", image: "https://archive.org/download/dom_20251106/Tx_Iuw-HnAzmgKSZsGgXEatwymlG86OJTzNFN1Wma3lQbj7sC8aecRqAmKUOdp6uKgumyxwbfGu2GN26ptLJ71oH.jpg", location: { lat: 55.359329, lon: 86.078126 }, descriptionShort: "Историческое здание, свидетель начала города.", subCategory: "Архитектурные достопримечательности" };
        const sovKirCrossroadRoute = { name: "Перекресток Советского и Кирова", distance: 0.5, time: "5 мин", difficulty: "Лёгкая", geoUrl: "https://yandex.ru/maps/-/CLSXVEOT", videoUrl: "https://rutube.ru/video/749d390303bbd9a5e1478d8da8e1bcd3/", audioUrl: "https://archive.org/download/sov-kir/sov-kir.MP3", image: "https://archive.org/download/sov-kir/ansambl-sovetskogo-2.jpg", location: { lat: 55.357470, lon: 86.075106 }, descriptionShort: "Архитектурный ансамбль.", subCategory: "Исторические кварталы", explicitDate: "2025-11-09" };
        const rampa = { name: "Памятник Лобсангу Рампе", distance: 0.5, time: "8 мин", difficulty: "Лёгкая", geoUrl: "https://yandex.ru/maps/-/CLWX7To5", videoUrl: "https://rutube.ru/video/58164fadc62c4f846920835b059e6b36/?r=wd", audioUrl: "https://archive.org/download/rampa_202511/rampa.MP3", image: "https://archive.org/download/rampa_202511/rampa.jpg", location: { lat: 55.357076, lon: 86.092200 }, descriptionShort: "Мистический памятник писателю.", subCategory: "Тайные и мистические маршруты", explicitDate: "2025-11-26" };
        const kuzbassMuseum = { name: "Кузбасский краеведческий музей", distance: 1.0, time: "12 мин", difficulty: "Лёгкая", geoUrl: "https://yandex.ru/maps/-/CLSXVMls", audioUrl: "https://archive.org/download/kuzbass-museum-2025/kuzbass_museum_audio.mp3", videoUrl: "https://rutube.ru/video/e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0/", image: "https://archive.org/download/kuzbass-museum-2025/kuzbass_museum_facade.jpg", location: { lat: 55.356116, lon: 86.080279 }, descriptionShort: "Главный краеведческий музей Кузбасса с богатой коллекцией.", subCategory: "Музеи и выставки" };
        const krasnayaGorkaMuseum = { name: "Музей-заповедник 'Красная Горка'", distance: 2.5, time: "30 мин", difficulty: "Средняя", geoUrl: "https://yandex.ru/maps/-/CLSXVBLq", audioUrl: "https://archive.org/download/krasnaya-gorka-2025/krasnaya_gorka_audio.mp3", videoUrl: "https://rutube.ru/video/f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1/", image: "https://archive.org/download/krasnaya-gorka-2025/krasnaya_gorka_panorama.jpg", location: { lat: 55.375438, lon: 86.071903 }, descriptionShort: "Уникальный музей под открытым небом на месте бывшей шахты.", subCategory: "Музеи и выставки" };
        const artMuseum = { name: "Музей ИЗО Кузбасса", distance: 1.1, time: "14 мин", difficulty: "Лёгкая", geoUrl: "https://yandex.ru/maps/-/CLSXVR4~", audioUrl: null, image: "https://images.unsplash.com/photo-1579541629828-5645a8f4c522?auto=format&fit=crop&w=1200&q=80", location: { lat: 55.356313, lon: 86.083243 }, descriptionShort: "Коллекции русского и зарубежного искусства.", subCategory: "Музеи и выставки" };
        const artCenter = { name: "Кузбасский центр искусств", distance: 1.3, time: "16 мин", difficulty: "Лёгкая", geoUrl: "https://yandex.ru/maps/-/CLSXVZ~V", audioUrl: null, image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80", location: { lat: 55.350957, lon: 86.075196 }, descriptionShort: "Современное арт-пространство.", subCategory: "Музеи и выставки" };
        const bezdomniipec = { name: "Бездомный Пес", distance: 0.3, time: "4 мин", difficulty: "Лёгкая", image: "https://archive.org/download/5fakt-1/bezdpe.jpg", audioUrl: "https://archive.org/download/00vvedenie-naberejnaya/%D0%B1%D0%B5%D0%B7%D0%B4%D0%BE%D0%BC%D0%BD%D1%8B%D0%B8%CC%86%20%D0%BF%D0%B5%D1%81.MP3", videoUrl: "https://rutube.ru/video/c9a406806ff214ecdc0b11f08874b32e/", location: { lat: 55.359703, lon: 86.086954 }, geoUrl: "https://yandex.ru/maps/-/CLSXVOj8", descriptionShort: "Трогательный памятник доброте.", subCategory: "Скульптуры и уличное искусство", explicitDate: "2025-11-21" };
        const mod = { name: "Модница", distance: 0.3, time: "3 мин", difficulty: "Лёгкая", image: "https://archive.org/download/modnica/XXXL.jpeg", audioUrl: "https://archive.org/download/modnica/modnica.MP3", location: { lat: 55.334873, lon: 86.174779 }, geoUrl: "https://yandex.ru/maps/-/CLgFuH67", descriptionShort: "Памятник девочке в маминых туфлях.", subCategory: "Скульптуры и уличное искусство", videoUrl: "https://rutube.ru/video/private/5106ecfe76e6c4d597832abed7e0887a/?p=np-frlzREk_KtGIxq4UfKg", explicitDate: "2025-12-05" };
        const olenLesnaya = { name: "Скульптура Олень", distance: 12.0, time: "25 мин (авто)", difficulty: "Лёгкая", image: "https://cdn-ru.bitrix24.ru/b35117284/landing/ef2/ef2830181fccd03ee7a3fe12d599ee77/orig_2x.jpeg", audioUrl: "https://archive.org/download/orig_20251118/olen.MP3", location: { lat: 55.416023, lon: 86.238736 }, geoUrl: "https://yandex.ru/maps/-/CLSXV8ov", videoUrl: "https://rutube.ru/video/4c0fb0036f5480277844c2c598f9d30d/", descriptionShort: "Скульптура в районе Лесная Поляна.", subCategory: "Природные зоны и парки", explicitDate: "2025-11-22" };
        const chas_usp = { name: "Часовня иконы Божией Матери", distance: 0.5, time: "6 мин", difficulty: "Лёгкая", image: "https://archive.org/download/dsc-1432_202511/DSC_1432.JPG", audioUrl: "https://archive.org/download/dsc-1432_202511/chas_usp.MP3", geoUrl: "https://yandex.ru/maps/-/CLSXVLlU", location: { lat: 55.353792, lon: 86.092382 }, descriptionShort: "Часовня Всех Скорбящих Радость.", subCategory: "Церкви и храмы", explicitDate: "2025-11-23", videoUrl: "https://rutube.ru/video/a667d8bccefbf54646a11b53166558cf/?r=wd" };

        // Маршруты Набережной
        const nabIntro = { name: "Введение в Набережную", distance: 0.1, time: "2 мин", difficulty: "Лёгкая", image: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/%D0%BD%D0%B0%D0%B1%D0%B5%D1%80%D0%B5%D0%B6%D0%BD%D0%B0%D1%8F.jpg", audioUrl: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/vvednaber.MP3", location: { lat: 55.365094, lon: 86.076369 }, videoUrl: "https://rutube.ru/video/340092f174a1c1614460c1d503f66ce0/", geoUrl: "https://yandex.ru/maps/-/CLSXZEJU", descriptionShort: "Начало прогулки по набережной.", subCategory: "Набережная" };
        const nabteremok = { name: "Теремок", distance: 0.1, time: "2 мин", difficulty: "Лёгкая", image: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/terem.jpg", audioUrl: "", location: { lat: 55.365094, lon: 86.076369 }, videoUrl: "https://rutube.ru/video/private/153d44b2c761310c5c55d9ae58f9e36e/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZEJU", descriptionShort: "Великолепное чугунное литье - фонари по набережной.", subCategory: "Набережная" };
        const nabfonar = { name: "Фонарные столбы набережной", distance: 0.1, time: "2 мин", difficulty: "Лёгкая", image: "https://archive.org/download/20260107_20260107_0715/fonari.JPG", audioUrl: "https://archive.org/download/00vvedenie-naberejnaya/fonary.MP3", location: { lat: 55.365094, lon: 86.076369 }, videoUrl: "https://rutube.ru/video/private/153d44b2c761310c5c55d9ae58f9e36e/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZEJU", descriptionShort: "Великолепное чугунное литье - фонари по набережной.", subCategory: "Набережная" };
        const nabBridges = { name: "Два моста", distance: 0.5, time: "5 мин", difficulty: "Лёгкая", image: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/2mos.jpg", audioUrl: "https://dn710206.ca.archive.org/0/items/00vvedenie-naberejnaya/00vvedenie_naberejnaya.MP3", location: { lat: 55.365094, lon: 86.076369 }, videoUrl: "https://rutube.ru/video/c0f701e82cfc8590fb98fb0af0e09af2/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZEJU", descriptionShort: "Два моста в начале набережной. Прошлое и будущее рядом.", subCategory: "Набережная" };
        const nabFences = { name: "Ограды набережной", distance: 0.2, time: "8 мин", difficulty: "Лёгкая", image: "https://archive.org/download/5fakt-1/ogr.jpg", audioUrl: "https://archive.org/download/ograjdenie_end/ograjdenie_end.MP3", location: { lat: 55.364308, lon: 86.077555 }, videoUrl: "https://rutube.ru/video/54e7ffe5157d385aca13656c8cf2e0f9/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZY0U", descriptionShort: "Уникальные чугунные ограждения.", subCategory: "Набережная" };
        const nabCinema = { name: "Здание старого кинотеатра", distance: 0.5, time: "6 мин", difficulty: "Лёгкая", image: "https://archive.org/download/5fakt-1/kino.jpg", audioUrl: "https://archive.org/download/00vvedenie-naberejnaya/antik.MP3", location: { lat: 55.362439, lon: 86.080820 }, videoUrl: "https://rutube.ru/video/private/8c329af55ade6c069b45d1fdd9f83892/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZO5T", descriptionShort: "Один из старейших кинотеатров города.", subCategory: "Набережная" };
        const nabHeart = { name: "Арт-обьект Я Люблю Кемерово", distance: 0.2, time: "4 мин", difficulty: "Лёгкая", image: "https://archive.org/download/20251107_20251107_1108/%D1%8F%20%D0%BB%D1%8E%D0%B1%D0%BB%D1%8E%20%D0%BA%D0%B5%D0%BC%D0%B5%D1%80%D0%BE%D0%B2%D0%BE.png", audioUrl: "https://archive.org/download/ograjdenie_end/%D1%81%D0%B5%D1%80%D0%B4%D1%86%D0%B5.MP3", location: { lat: 55.359595, lon: 86.087298 }, videoUrl: "https://rutube.ru/video/a38198ad8df1e004b93c0e56940f331c/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZXIO", descriptionShort: "Популярный арт-объект.", subCategory: "Набережная" };

        structure["Культурные и исторические маршруты"]["Набережная"] = [rampa, bezdomniipec, nabIntro, nabBridges, nabfonar, nabteremok, nabFences, nabCinema, nabHeart];
        structure["Культурные и исторические маршруты"]["Музеи и выставки"] = [kuzbassMuseum, krasnayaGorkaMuseum, artMuseum, artCenter];
        structure["Культурные и исторические маршруты"]["Памятники и мемориалы"] = [rampa, pushkinRoute, minerRoute, leninMemorialRoute, chas_usp];
        structure["Культурные и исторические маршруты"]["Архитектурные достопримечательности"] = [mod, chas_usp, minerRoute, pushkinRoute, leninMemorialRoute, oldestHouseRoute, olenLesnaya];
        structure["Культурные и исторические маршруты"]["Городские площади"] = [pushkinRoute, minerRoute, leninMemorialRoute];
        structure["Культурные и исторические маршруты"]["Исторические кварталы"] = [sovKirCrossroadRoute];
        structure["Культурные и исторические маршруты"]["Церкви и храмы"] = [chas_usp];
        structure["Культурные и исторические маршруты"]["Легенды и мифы города"] = [rampa, olenLesnaya];
        structure["Природные и активные маршруты"]["Природные зоны и парки"] = [mod, olenLesnaya];
        structure["Современные и урбанистические маршруты"]["Скульптуры и уличное искусство"] = [mod, minerRoute, pushkinRoute, leninMemorialRoute, bezdomniipec, olenLesnaya];
        structure["Современные и урбанистические маршруты"]["Современная архитектура"] = [mod, bezdomniipec];
        structure["Современные и урбанистические маршруты"]["Реставрации и обновления"] = [oldestHouseRoute, sovKirCrossroadRoute];
        structure["Гастрономические маршруты"]["Кофе"] = [importCoffeeRoute];
        structure["Семейные маршруты"]["Парки аттракционы и детские площадки"] = [olenLesnaya];
        structure["Семейные маршруты"]["Игровые центры и развлекательные зоны"] = [olenLesnaya];
        structure["Альтернативные маршруты"]["Урбанистические исследования"] = [chas_usp, olenLesnaya, oldestHouseRoute, sovKirCrossroadRoute];
        structure["Альтернативные маршруты"]["Тайные и мистические маршруты"] = [rampa];
        structure["Тематические маршруты"]["Мифы и легенды"] = [rampa, olenLesnaya];
        structure["Культурные и исторические маршруты"]["Легенды и мифы города"].push(fiveFacts);

    } else if (cityId === 'arambol') {
        const arambolBeach = { name: t("Arambol Beach"), distance: 1.5, time: "6 " + t("min"), difficulty: t("Medium"), image: "https://archive.org/download/goa-1024x-680/Goa-1024x680.jpg", geoUrl: "https://maps.app.goo.gl/mVoYhBf7nAqKiKWx7", location: { lat: 15.6829383, lon: 73.6929683 }, descriptionShort: t("Best beach in North Goa"), explicitDate: "2025-12-13", audioUrl: (lang === 'hi' ? "https://archive.org/download/goa-1024x-680/arambol_h.MP3" : lang === 'en' ? "https://archive.org/download/goa-1024x-680/arambol_eng.MP3" : "https://archive.org/download/goa-1024x-680/arambol_rus.MP3"), videoUrl: (lang === 'hi' ? "https://rutube.ru/video/private/8d7256abdb3cc51cda3ebf4a5a3bb57c/?p=mjNDU-S38A_xHjVQdvglpQ" : lang === 'en' ? "https://rutube.ru/video/private/d0634cc6d8907afeba29adcf7b675908/?p=co84PNALaar0OPeQwD5y2A" : "https://rutube.ru/video/eaa62c560c6d5cc5ced9164e4a850c16/"), subCategory: "Природные зоны и парки" };
        const baba = { name: t("Baba Tree"), distance: 3.5, time: "60 " + t("min"), difficulty: t("High"), image: "https://archive.org/download/baba_ru/787r65.webp", geoUrl: "https://maps.app.goo.gl/jsmedcda8JxSMwkk6", location: { lat: 15.7014833, lon: 73.6987244 }, descriptionShort: t("Baba Description"), explicitDate: "2025-12-14", audioUrl: (lang === 'hi' ? "https://archive.org/download/baba_ru/baba_h.MP3" : lang === 'en' ? "https://archive.org/download/baba_ru/baba_en.MP3" : "https://archive.org/download/baba_ru/baba_ru.MP3"), videoUrl: (lang === 'hi' ? "https://rutube.ru/video/a50d78643366b84f590e1016b1912753/" : lang === 'en' ? "https://rutube.ru/video/df27fd14fef5903f9811bcf7644e2f04/" : "https://rutube.ru/video/0e7ec12a570e26c8e1d4d9f3f764d152/"), subCategory: "Тайные и мистические маршруты" };
        const rocks = { name: t("Arambol Rocks"), distance: 1.0, time: "25 " + t("min"), difficulty: t("Medium"), image: "https://archive.org/download/rocks_202512/rocks.png", geoUrl: "https://maps.app.goo.gl/Kzi3dSTYhv5sTZZt7", location: { lat: 15.69227, lon: 73.6984093 }, descriptionShort: t("Rocks Description"), explicitDate: "2025-12-15", audioUrl: (lang === 'hi' ? "https://archive.org/download/rocks_202512/arambol_rocks_h.MP3" : lang === 'en' ? "https://archive.org/download/rocks_202512/arambol_rocks_en.MP3" : "https://archive.org/download/rocks_202512/arambol_rocks_ru.MP3"), videoUrl: (lang === 'hi' ? "https://rutube.ru/video/48ca5716013a776edd36f0b90b2df8ec/" : lang === 'en' ? "https://rutube.ru/video/9c621002437d96927b43391613f6124f/" : "https://rutube.ru/video/816d068ad920f92154606ac96e15501c/"), subCategory: "Природные зоны и парки" };

        structure["Природные и активные маршруты"]["Природные зоны и парки"] = [arambolBeach, baba, rocks];
        structure["Природные и активные маршруты"]["Горные и лесные маршруты"] = [baba];
        structure["Природные и активные маршруты"]["Активный отдых у воды"] = [arambolBeach, rocks];
        structure["Альтернативные маршруты"]["Тайные и мистические маршруты"] = [baba];
        structure["Тематические маршруты"]["Мифы и легенды"] = [baba];
        structure["Тематические маршруты"]["Музыкальные маршруты"] = [arambolBeach];
        structure["Культурные и исторические маршруты"]["Легенды и мифы города"] = [baba];
        structure["Семейные маршруты"]["Пикники на природе"] = [arambolBeach, rocks];

    } else if (cityId === 'moscow') {
        const redSquare = { name: t("Red Square"), distance: 0.5, time: "10 min", image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1200", location: { lat: 55.7539, lon: 37.6208 }, descriptionShort: "Heart of Moscow.", subCategory: "Памятники и мемориалы" };
        const zaryadye = { name: t("Zaryadye"), distance: 0.8, time: "15 min", image: "https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=1200", location: { lat: 55.7511, lon: 37.6287 }, descriptionShort: "Modern park.", subCategory: "Природные зоны и парки" };
        structure["Культурные и исторические маршруты"]["Памятники и мемориалы"] = [redSquare];
        structure["Природные и активные маршруты"]["Природные зоны и парки"] = [zaryadye];
    } else if (cityId === 'yerevan') {
        const cascade = { name: t("Cascade"), distance: 1.0, time: "20 min", image: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=1200", location: { lat: 40.1925, lon: 44.5165 }, descriptionShort: "Giant stairway.", subCategory: "Архитектурные достопримечательности" };
        structure["Культурные и исторические маршруты"]["Архитектурные достопримечательности"] = [cascade];
    } else if (cityId === 'dusseldorf') {
        const tower = { name: t("Rheinturm"), distance: 0.2, time: "10 min", image: "https://images.unsplash.com/photo-1555818671-55b35242735a?w=1200", location: { lat: 51.2179, lon: 6.7617 }, descriptionShort: "Telecommunications tower.", subCategory: "Архитектурные достопримечательности" };
        structure["Культурные и исторические маршруты"]["Архитектурные достопримечательности"] = [tower];
    }

    return structure;
};