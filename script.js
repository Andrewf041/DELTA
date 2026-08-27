function adjustAppHeight() {
    let currentHeight = window.innerHeight;
    if (window.visualViewport) {
        currentHeight = window.visualViewport.height;
    }
    document.documentElement.style.setProperty('--app-height', `${currentHeight}px`);
    const chatArea = document.getElementById('chat');
    if (chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
    window.scrollTo(0, 0);
}

window.addEventListener('resize', adjustAppHeight);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', adjustAppHeight);
    window.visualViewport.addEventListener('scroll', adjustAppHeight);
}

adjustAppHeight();

const inputField = document.getElementById('userInput');
inputField.addEventListener('focus', () => {
    setTimeout(adjustAppHeight, 100);
    setTimeout(adjustAppHeight, 300);
});

function updateClock() {
    const now = new Date();
    document.getElementById('liveClock').innerText = now.toTimeString().split(' ')[0];
    document.getElementById('liveDate').innerText = now.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}
setInterval(updateClock, 1000); 
updateClock();

let currentWeather = "Неизвестно";
async function updateWeather() {
    try {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current_weather=true';
        const res = await fetch(url);
        const data = await res.json();
        const temp = data.current_weather.temperature;
        currentWeather = (temp > 0 ? '+' : '') + temp + '°C';
        document.getElementById('liveWeather').innerHTML = `Москва<br><b>${currentWeather}</b>`;
    } catch (e) {
        document.getElementById('liveWeather').innerHTML = `Москва<br><b>OFFLINE</b>`;
    }
}
updateWeather(); 
setInterval(updateWeather, 1800000); 

function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    let cleanText = text.replace(/<[^>]*>?/gm, '').replace(/\[.*?\]:\s*/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.05;
    utterance.pitch = 1.2; 
    const voices = window.speechSynthesis.getVoices();
    const ruVoices = voices.filter(v => v.lang.includes('ru'));
    if (ruVoices.length > 0) {
        utterance.voice = ruVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('elena')) || ruVoices[0];
    }
    window.speechSynthesis.speak(utterance);
}

const KNOWLEDGE_BASE = {
    "досье": `[ДОСЬЕ СОЗДАТЕЛЯ]: 
Имя: Андрей Дмитриевич Давидонис.
Возраст: 22 года (г.р. 6 февраля 2004).
Физиология: 185 см, 80 кг.
Семья: Девушка Алиса (разработчик в "Кампус"). Мама Юля, папа Дима, брат Женя. Родители Алисы: Наташа и Костя.
Питомцы: Две собаки (Дора, Тагер), кошка (Муся).
Транспорт: Land Rover Freelander 2 (2008, 2.2 TD4). Транспортная карта (метро), поезда РЖД.
Проекты: Aetherforge Cinematic Universe, сценарии, ИИ-музыка, Python-разработка. Гейминг: NBA 2K24 (PS5). Хобби: выращивание манго из косточки.`,

    "учеба": `[АКАДЕМИЧЕСКИЙ СТАТУС]: 
Вы являетесь студентом 5-го курса РУТ (МИИТ), кафедра ИУЦТ. 
Текущая задача: защита дипломной работы "Адаптивная логистика перевозок в условиях санкций". 
Практический опыт: стажировка в должности дежурного по станции Силикатная (Московско-Курское направление).`,

    "флорбол": `[СПОРТ: ФЛОРБОЛ]:
Ваша позиция: Голкипер в команде "Феникс" (Москва). 
О спорте: Флорбол — разновидность хоккея с мячом в закрытых помещениях. Играется пластиковым мячом. 
Экипировка вратаря: Вратарь играет без клюшки, в специальном шлеме и защитной амуниции, передвигаясь на коленях. Требует высочайшей реакции.
Недавние события: Турнир в Казани (апрель 2026), разработка логотипа и формы для команды.`,

    "ржд": `[БАЗА: ОАО «РЖД»]:
Железные дороги России. Основные термины:
1. ПТЭ (Правила технической эксплуатации) — главный документ на ЖД.
2. Светофоры — линзовые и прожекторные. Красный - стой, желтый - разрешается движение с готовностью остановиться, зеленый - путь свободен.
3. Станция Силикатная — грузо-пассажирская станция Московской железной дороги в Подольске. Ваше место прохождения практики в качестве ДСП (дежурного по станции).`,

    "науки": `[БАЗА: НАУКИ]:
1. Физика — изучает законы природы, материю, энергию. Базовые разделы: механика, термодинамика, электромагнетизм.
2. Биология — наука о живых существах. Изучает клетки, ДНК, эволюцию.
3. Астрономия — наука о космосе. Звезды, планеты, черные дыры.
4. Информатика — наука об алгоритмах и данных. Основа создания ИИ.
5. Химия — наука о веществах, их строении и реакциях.`,

    "правила умножения": `[МАТЕМАТИКА: УМНОЖЕНИЕ]:
Умножение — это быстрое сложение одинаковых чисел.
- Любое число, умноженное на 1, равно самому себе (A × 1 = A).
- Любое число, умноженное на 0, равно 0 (A × 0 = 0).
- От перестановки множителей произведение не меняется (A × B = B × A).
*Напишите мне любой пример (например, 25 * 4), и я решу его.*`,

    "орфография": `[БАЗА: РУССКИЙ ЯЗЫК]:
Основные правила орфографии:
1. ЖИ и ШИ пиши с буквой И.
2. ЧА и ЩА пиши с буквой А.
3. ЧУ и ЩУ пиши с буквой У.
4. Безударную гласную в корне проверяй ударением (вОда - вОды, рЕка - рЕки).
5. Не с глаголами пишется раздельно (не знал, не выучил).`
};

function evaluateMath(query) {
    let sanitized = query.replace(/[xх×]/gi, '*').replace(/÷|:/g, '/').replace(/,/g, '.');
    sanitized = sanitized.replace(/\s+/g, ''); 
    const mathRegex = /^[\d\+\-\*\/\.\(\)]+$/;
    
    if (mathRegex.test(sanitized) && /[\+\-\*\/]/.test(sanitized)) {
        try {
            let result = Function('"use strict";return (' + sanitized + ')')();
            result = Math.round(result * 10000) / 10000;
            return `[ВЫЧИСЛЕНИЕ]: ${query.trim()} = ${result}`;
        } catch(e) {
            return null;
        }
    }
    return null;
}

async function queryWikipedia(searchString) {
    try {
        const url = `https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchString)}&utf8=&format=json&origin=*`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.query && data.query.search.length > 0) {
            let item = data.query.search[0];
            let cleanSnippet = item.snippet.replace(/(<([^>]+)>)/gi, "").replace(/\[\d+\]/g, "");
            return `[ПОИСК WIKI]: <b>${item.title}</b><br>${cleanSnippet.trim()}...`;
        }
    } catch (error) {}
    return null;
}

async function processAIResponse(rawQuery) {
    const query = rawQuery.toLowerCase().trim();
    const mathResult = evaluateMath(rawQuery);
    if (mathResult) return mathResult;

    if (query.includes("погод")) {
        return `[МЕТЕО-СВОДКА]: Температура в Москве в данный момент составляет ${currentWeather}.`;
    }

    if (/(кто я|мое досье|мои данные|про меня|очередной отчет|досье)/.test(query)) return KNOWLEDGE_BASE["досье"];
    if (/(учеба|миит|рут|иуцт|диплом|силикатная)/.test(query)) return KNOWLEDGE_BASE["учеба"];
    if (/(флорбол|феникс|вратарь|турнир)/.test(query)) return KNOWLEDGE_BASE["флорбол"];
    if (/(ржд|железная дорога|железнодорожн|птэ)/.test(query)) return KNOWLEDGE_BASE["ржд"];
    if (/(какие науки|физика|химия|биология|астрономия|информатика)/.test(query)) return KNOWLEDGE_BASE["науки"];
    if (/(умножени|как умножать)/.test(query)) return KNOWLEDGE_BASE["правила умножения"];
    if (/(орфографи|правила русского|жи ши)/.test(query)) return KNOWLEDGE_BASE["орфография"];

    if (/^(привет|ку|хай|добрый день|здравствуй)/.test(query)) return "Рада вас слышать. Ядро I.V.I. стабильно, все системы в норме.";
    if (/(кто ты|что ты)/.test(query)) return "Я - I.V.I., интеллектуальная визуальная система.";

    let searchQ = query;
    const fillers = ["кто такой", "что такое", "расскажи про", "информация о", "найди"];
    for (let f of fillers) {
        if (searchQ.startsWith(f)) {
            searchQ = searchQ.replace(f, "").trim();
            break;
        }
    }

    if (searchQ.length > 2) {
        const wikiResult = await queryWikipedia(searchQ);
        if (wikiResult) return wikiResult;
    }

    return `[ОТКАЗ]: Данных по запросу "${rawQuery}" не обнаружено в моей памяти и открытых источниках.`;
}

async function handleSend() {
    const input = document.getElementById('userInput');
    const chatArea = document.getElementById('chat');
    const text = input.value.trim();
    
    if (text) {
        chatArea.innerHTML += `<div class="message msg-user">${text}</div>`;
        input.value = '';
        chatArea.scrollTop = chatArea.scrollHeight;
        
        const loadingId = 'load-' + Date.now();
        chatArea.innerHTML += `<div id="${loadingId}" class="message msg-ivi loading">Анализ...</div>`;
        chatArea.scrollTop = chatArea.scrollHeight;

        const response = await processAIResponse(text);
        
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();
        
        chatArea.innerHTML += `<div class="message msg-ivi">${response}</div>`;
        chatArea.scrollTop = chatArea.scrollHeight;

        speakText(response);
    }
}

document.getElementById('sendBtn').addEventListener('click', handleSend);
document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
    }
});



