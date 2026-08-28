/* ============================================================
   I.V.I. — Intelligent Visual Interface
   Core Script v3.0 — Full Edition
   ============================================================ */

/* ────────────────────────────────────────────────────────────
   1. STATE & CONFIG
   ──────────────────────────────────────────────────────────── */

const STATE = {
    conversationContext: [],
    chatHistory: [],
    commandHistory: JSON.parse(localStorage.getItem('ivi_cmd_history') || '[]'),
    commandHistoryIndex: -1,
    userCity: 'Москва',
    userLat: 55.7558,
    userLon: 37.6173,
    currentWeather: 'Неизвестно',
    weatherDescription: '',
    isProcessing: false,
    voiceEnabled: localStorage.getItem('ivi_voice') !== 'off',
    memory: JSON.parse(localStorage.getItem('ivi_memory') || '{}'),
    todos: JSON.parse(localStorage.getItem('ivi_todos') || '[]'),
    timers: {},
    stopwatch: null,
    isListening: false,
    particleSystem: null,
    bootComplete: false,
    soundEnabled: localStorage.getItem('ivi_sound') !== 'off'
};

window._bootTime = Date.now();

/* ────────────────────────────────────────────────────────────
   2. SOUND EFFECTS (Web Audio API — no files needed)
   ──────────────────────────────────────────────────────────── */

const SFX = {
    _ctx: null,
    getCtx() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this._ctx;
    },
    play(type) {
        if (!STATE.soundEnabled) return;
        try {
            const ctx = this.getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            const t = ctx.currentTime;

            switch (type) {
                case 'send':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, t);
                    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.08);
                    gain.gain.setValueAtTime(0.08, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.start(t);
                    osc.stop(t + 0.12);
                    break;
                case 'receive':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(520, t);
                    osc.frequency.exponentialRampToValueAtTime(780, t + 0.15);
                    gain.gain.setValueAtTime(0.06, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                    osc.start(t);
                    osc.stop(t + 0.2);
                    break;
                case 'boot':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(300, t);
                    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.4);
                    gain.gain.setValueAtTime(0.05, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                    osc.start(t);
                    osc.stop(t + 0.5);
                    break;
                case 'error':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(200, t);
                    gain.gain.setValueAtTime(0.06, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                    osc.start(t);
                    osc.stop(t + 0.25);
                    break;
                case 'timer':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, t);
                    gain.gain.setValueAtTime(0.1, t);
                    gain.gain.setValueAtTime(0.001, t + 0.15);
                    gain.gain.setValueAtTime(0.1, t + 0.2);
                    gain.gain.setValueAtTime(0.001, t + 0.35);
                    gain.gain.setValueAtTime(0.1, t + 0.4);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
                    osc.start(t);
                    osc.stop(t + 0.6);
                    break;
                case 'mic':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(660, t);
                    gain.gain.setValueAtTime(0.07, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                    osc.start(t);
                    osc.stop(t + 0.1);
                    break;
            }
        } catch (e) { /* Audio not supported */ }
    }
};

/* ────────────────────────────────────────────────────────────
   3. PARTICLE SYSTEM
   ──────────────────────────────────────────────────────────── */

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 55;
        this.connectionDist = 120;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.init();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            const isCyan = Math.random() > 0.35;
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.4 + 0.15,
                color: isCyan ? '0,212,255' : '255,183,3'
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
            this.ctx.fill();
        }
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.connectionDist) {
                    const opacity = (1 - dist / this.connectionDist) * 0.1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(0,212,255,${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
        requestAnimationFrame(() => this.animate());
    }
}

/* ────────────────────────────────────────────────────────────
   4. VIEWPORT ADJUSTMENT
   ──────────────────────────────────────────────────────────── */

let resizeTimeout;
function adjustAppHeight() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        let h = window.innerHeight;
        if (window.visualViewport) h = window.visualViewport.height;
        document.documentElement.style.setProperty('--app-height', `${h}px`);
        const chat = document.getElementById('chat');
        if (chat) chat.scrollTop = chat.scrollHeight;
        window.scrollTo(0, 0);
    }, 50);
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

/* ────────────────────────────────────────────────────────────
   5. CLOCK
   ──────────────────────────────────────────────────────────── */

function updateClock() {
    const now = new Date();
    document.getElementById('liveClock').textContent = now.toTimeString().split(' ')[0];
    document.getElementById('liveDate').textContent = now.toLocaleDateString('ru-RU', {
        weekday: 'short', day: 'numeric', month: 'short'
    });
}
setInterval(updateClock, 1000);
updateClock();

/* ────────────────────────────────────────────────────────────
   6. GEOLOCATION & WEATHER
   ──────────────────────────────────────────────────────────── */

const WEATHER_CODES = {
    0: { text: 'Ясно', icon: '☀️' },
    1: { text: 'Малооблачно', icon: '🌤️' },
    2: { text: 'Облачно', icon: '⛅' },
    3: { text: 'Пасмурно', icon: '☁️' },
    45: { text: 'Туман', icon: '🌫️' }, 48: { text: 'Туман', icon: '🌫️' },
    51: { text: 'Морось', icon: '🌦️' }, 53: { text: 'Морось', icon: '🌦️' }, 55: { text: 'Морось', icon: '🌦️' },
    56: { text: 'Изморозь', icon: '🌧️' }, 57: { text: 'Изморозь', icon: '🌧️' },
    61: { text: 'Дождь', icon: '🌧️' }, 63: { text: 'Дождь', icon: '🌧️' }, 65: { text: 'Сильный дождь', icon: '🌧️' },
    66: { text: 'Лед. дождь', icon: '🌨️' }, 67: { text: 'Лед. дождь', icon: '🌨️' },
    71: { text: 'Снег', icon: '🌨️' }, 73: { text: 'Снег', icon: '❄️' }, 75: { text: 'Сильный снег', icon: '❄️' },
    77: { text: 'Снежные зёрна', icon: '❄️' },
    80: { text: 'Ливень', icon: '🌧️' }, 81: { text: 'Ливень', icon: '🌧️' }, 82: { text: 'Ливень', icon: '⛈️' },
    85: { text: 'Снегопад', icon: '🌨️' }, 86: { text: 'Снегопад', icon: '🌨️' },
    95: { text: 'Гроза', icon: '⛈️' }, 96: { text: 'Гроза с градом', icon: '⛈️' }, 99: { text: 'Гроза с градом', icon: '⛈️' }
};

function getWeatherInfo(code) {
    return WEATHER_CODES[code] || { text: 'Неизвестно', icon: '🌡️' };
}

function initGeolocation() {
    if (!navigator.geolocation) { updateWeather(); return; }
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            STATE.userLat = pos.coords.latitude;
            STATE.userLon = pos.coords.longitude;
            try {
                const r = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${STATE.userLat}&lon=${STATE.userLon}&format=json&accept-language=ru`,
                    { headers: { 'User-Agent': 'IVI-Assistant/3.0' } }
                );
                const d = await r.json();
                STATE.userCity = d.address?.city || d.address?.town || d.address?.village || d.address?.state || 'Неизвестно';
            } catch (e) { console.warn('Geocode error:', e); }
            updateWeather();
        },
        () => { updateWeather(); },
        { timeout: 8000, enableHighAccuracy: false }
    );
}

async function updateWeather() {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${STATE.userLat}&longitude=${STATE.userLon}&current_weather=true`;
        const res = await fetch(url);
        const data = await res.json();
        const temp = data.current_weather.temperature;
        const code = data.current_weather.weathercode;
        const info = getWeatherInfo(code);
        STATE.currentWeather = (temp > 0 ? '+' : '') + temp + '°C';
        STATE.weatherDescription = info.text;
        document.getElementById('liveWeather').innerHTML =
            `${STATE.userCity}<br><b>${info.icon} ${STATE.currentWeather}</b> ${info.text}`;
    } catch (e) {
        document.getElementById('liveWeather').innerHTML =
            `${STATE.userCity}<br><b>⚠️ OFFLINE</b>`;
    }
}
setInterval(updateWeather, 1800000);

/* ────────────────────────────────────────────────────────────
   7. TEXT-TO-SPEECH
   ──────────────────────────────────────────────────────────── */

let voicesLoaded = false;
function loadVoices() {
    if ('speechSynthesis' in window) { window.speechSynthesis.getVoices(); voicesLoaded = true; }
}
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
}

function speakText(text) {
    if (!('speechSynthesis' in window) || !STATE.voiceEnabled) return;
    window.speechSynthesis.cancel();
    let clean = text.replace(/<[^>]*>/g, '').replace(/\[.*?\]:\s*/g, '').replace(/[◆●▶⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏✓✗]/g, '').trim();
    if (!clean || clean.length < 2) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'ru-RU';
    u.rate = 1.05;
    u.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const ru = voices.filter(v => v.lang.includes('ru'));
    if (ru.length > 0) {
        u.voice = ru.find(v => /female|elena|milena|irina/i.test(v.name)) || ru[0];
    }
    window.speechSynthesis.speak(u);
}

/* ────────────────────────────────────────────────────────────
   8. VOICE INPUT (Speech Recognition)
   ──────────────────────────────────────────────────────────── */

let recognition = null;

function initVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        inputField.value = transcript;
        if (event.results[event.results.length - 1].isFinal) {
            stopListening();
            if (transcript.trim()) {
                setTimeout(() => handleSend(), 300);
            }
        }
    };

    recognition.onend = () => { stopListening(); };
    recognition.onerror = (e) => {
        console.warn('Speech error:', e.error);
        stopListening();
    };
}

function startListening() {
    if (!recognition) { initVoiceInput(); }
    if (!recognition) {
        addIVIMessage('Голосовой ввод не поддерживается в этом браузере.', false);
        return;
    }
    try {
        STATE.isListening = true;
        const micBtn = document.getElementById('micBtn');
        if (micBtn) micBtn.classList.add('listening');
        SFX.play('mic');
        recognition.start();
    } catch (e) {
        stopListening();
    }
}

function stopListening() {
    STATE.isListening = false;
    const micBtn = document.getElementById('micBtn');
    if (micBtn) micBtn.classList.remove('listening');
    try { recognition?.stop(); } catch (e) {}
}

function toggleVoiceInput() {
    if (STATE.isListening) {
        stopListening();
    } else {
        startListening();
    }
}

/* ────────────────────────────────────────────────────────────
   9. MEMORY SYSTEM
   ──────────────────────────────────────────────────────────── */

const MEMORY = {
    save(text) {
        const id = Date.now().toString(36);
        STATE.memory[id] = { text, timestamp: Date.now() };
        localStorage.setItem('ivi_memory', JSON.stringify(STATE.memory));
        return id;
    },
    count() { return Object.keys(STATE.memory).length; },
    clear() { STATE.memory = {}; localStorage.setItem('ivi_memory', '{}'); },
    format() {
        const e = Object.values(STATE.memory);
        if (e.length === 0) return 'Память пуста.';
        return e.map((m, i) => {
            const d = new Date(m.timestamp).toLocaleString('ru-RU');
            return `${i + 1}. ${m.text} (${d})`;
        }).join('\n');
    }
};

/* ────────────────────────────────────────────────────────────
   10. TODO / TASK SYSTEM
   ──────────────────────────────────────────────────────────── */

const TODO = {
    add(text) {
        STATE.todos.push({ text, done: false, created: Date.now() });
        this._save();
    },
    remove(index) {
        if (index >= 0 && index < STATE.todos.length) {
            STATE.todos.splice(index, 1);
            this._save();
            return true;
        }
        return false;
    },
    toggle(index) {
        if (index >= 0 && index < STATE.todos.length) {
            STATE.todos[index].done = !STATE.todos[index].done;
            this._save();
            return true;
        }
        return false;
    },
    list() {
        if (STATE.todos.length === 0) return 'Список задач пуст.';
        return STATE.todos.map((t, i) => {
            const mark = t.done ? '✅' : '⬜';
            return `${mark} ${i + 1}. ${t.text}`;
        }).join('\n');
    },
    clear() {
        STATE.todos = [];
        this._save();
    },
    _save() {
        localStorage.setItem('ivi_todos', JSON.stringify(STATE.todos));
    }
};

/* ────────────────────────────────────────────────────────────
   11. KNOWLEDGE BASE
   ──────────────────────────────────────────────────────────── */

const KNOWLEDGE_BASE = {
    "досье": `[ДОСЬЕ СОЗДАТЕЛЯ]:
Имя: Андрей Дмитриевич Давидонис.
Возраст: 22 года (дата рождения: 6 февраля 2004).
Физиология: 185 см, 80 кг.
Семья: Девушка Алиса (разработчик в «Кампус»). Мама Юля, папа Дима, брат Женя. Родители Алисы: Наташа и Костя.
Питомцы: Две собаки (Дора, Тагер), кошка (Муся).
Транспорт: Land Rover Freelander 2 (2008, 2.2 TD4). Транспортная карта (метро), поезда РЖД.
Проекты: Aetherforge Cinematic Universe, сценарии, ИИ-музыка, Python-разработка.
Гейминг: NBA 2K24 (PS5).
Хобби: выращивание манго из косточки.`,

    "учеба": `[АКАДЕМИЧЕСКИЙ СТАТУС]:
Студент 5-го курса РУТ (МИИТ), кафедра ИУЦТ.
Текущая задача: защита дипломной работы «Адаптивная логистика перевозок в условиях санкций».
Практический опыт: стажировка — дежурный по станции Силикатная (Московско-Курское направление).`,

    "флорбол": `[СПОРТ: ФЛОРБОЛ]:
Позиция: Голкипер в команде «Феникс» (Москва).
О спорте: Флорбол — разновидность хоккея с мячом в помещениях. Играется пластиковым мячом.
Экипировка вратаря: без клюшки, в шлеме и защитной амуниции, передвижение на коленях.
Недавние события: Турнир в Казани (апрель 2026), разработка логотипа и формы для команды.`,

    "ржд": `[БАЗА: ОАО «РЖД»]:
Железные дороги России. Основные термины:
1. ПТЭ — Правила технической эксплуатации, главный документ на ЖД.
2. Светофоры — линзовые и прожекторные. Красный — стой, жёлтый — движение с готовностью остановиться, зелёный — путь свободен.
3. Станция Силикатная — грузо-пассажирская станция МЖД в Подольске.`,

    "науки": `[БАЗА: НАУКИ]:
1. Физика — законы природы, материя, энергия. Механика, термодинамика, электромагнетизм, квантовая физика.
2. Биология — живые существа: клетки, ДНК, эволюция, экосистемы.
3. Астрономия — космос: звёзды, планеты, галактики, чёрные дыры.
4. Информатика — алгоритмы, данные, программирование, ИИ.
5. Химия — вещества, их строение и реакции.`,

    "правила умножения": `[МАТЕМАТИКА: УМНОЖЕНИЕ]:
Умножение — быстрое сложение одинаковых чисел.
• A × 1 = A.  • A × 0 = 0.  • A × B = B × A.
Напишите мне пример, и я решу его.`,

    "орфография": `[БАЗА: РУССКИЙ ЯЗЫК]:
1. ЖИ/ШИ — с И.  2. ЧА/ЩА — с А.  3. ЧУ/ЩУ — с У.
4. Безударную гласную проверяй ударением (вОда — вОды).
5. НЕ с глаголами — раздельно.
6. Удвоенные: класс, аллея, грамматика.`,

    "программирование": `[БАЗА: ПРОГРАММИРОВАНИЕ]:
1. Python — ИИ, ML, веб, автоматизация. Простой синтаксис.
2. JavaScript — фронтенд и бэкенд (Node.js). React, Vue, Angular.
3. C++ — системное программирование, игры, производительность.
4. Java — энтерпрайз, Android.
5. Go — микросервисы, серверное ПО.
6. Rust — безопасная работа с памятью.
7. TypeScript — JS с типизацией.
8. Swift — iOS/macOS.`,

    "история россии": `[БАЗА: ИСТОРИЯ РОССИИ]:
• 862 — начало Руси.  • 988 — Крещение Руси.  • 1147 — первое упоминание Москвы.
• 1380 — Куликовская битва.  • 1613 — династия Романовых.
• 1703 — основание Петербурга.  • 1812 — Отечественная война.
• 1861 — отмена крепостного права.  • 1917 — Революции.
• 1941–1945 — Великая Отечественная война.  • 1961 — полёт Гагарина.
• 1991 — образование РФ.`,

    "география": `[БАЗА: ГЕОГРАФИЯ]:
Материки: Евразия, Африка, Сев. Америка, Юж. Америка, Антарктида, Австралия.
Океаны: Тихий, Атлантический, Индийский, Сев. Ледовитый, Южный.
Факты: Россия — 17,1 млн км². Эверест — 8 849 м. Марианская впадина — 10 994 м. Байкал — 1 642 м глубины.`,

    "здоровье": `[БАЗА: ЗДОРОВЬЕ]:
1. Сон: 7–9 часов.  2. Вода: 1,5–2 л/день.
3. Питание: овощи, фрукты, белок. Меньше сахара.
4. Активность: 150 мин. нагрузки в неделю.
5. Осанка: разминка каждый час при сидячей работе.`
};

/* ────────────────────────────────────────────────────────────
   12. MATH EVALUATOR
   ──────────────────────────────────────────────────────────── */

function evaluateMath(query) {
    let s = query.trim();

    const sqrtMatch = s.match(/(?:квадратный\s*)?корень\s*(?:из\s*)?([\d.,]+)/i);
    if (sqrtMatch) {
        const num = parseFloat(sqrtMatch[1].replace(',', '.'));
        if (!isNaN(num) && num >= 0) return `[ВЫЧИСЛЕНИЕ]: √${num} = ${Math.round(Math.sqrt(num) * 10000) / 10000}`;
    }

    const pctMatch = s.match(/([\d.,]+)\s*%\s*(?:от)\s*([\d.,]+)/i);
    if (pctMatch) {
        const pct = parseFloat(pctMatch[1].replace(',', '.'));
        const base = parseFloat(pctMatch[2].replace(',', '.'));
        if (!isNaN(pct) && !isNaN(base)) return `[ВЫЧИСЛЕНИЕ]: ${pct}% от ${base} = ${Math.round(base * pct / 100 * 10000) / 10000}`;
    }

    let sanitized = s.replace(/[xх×]/gi, '*').replace(/[÷:]/g, '/').replace(/,/g, '.').replace(/\^/g, '**').replace(/\s+/g, '');
    const mathRegex = /^[\d\+\-\*\/\.\(\)\%]+$/;
    if (mathRegex.test(sanitized) && /[\+\-\*\/\%]/.test(sanitized)) {
        try {
            let result = Function('"use strict";return (' + sanitized + ')')();
            if (!isFinite(result)) return null;
            result = Math.round(result * 10000) / 10000;
            return `[ВЫЧИСЛЕНИЕ]: ${query.trim()} = ${result}`;
        } catch (e) { return null; }
    }
    return null;
}

/* ────────────────────────────────────────────────────────────
   13. AI — POLLINATIONS.AI (Free, no API key)
   ──────────────────────────────────────────────────────────── */

async function queryAI(userMessage) {
    const systemPrompt = `Ты — I.V.I. (Intelligent Visual Interface), продвинутая интеллектуальная система, созданная Андреем Давидонисом.
Ты отвечаешь кратко, информативно и по делу на русском языке.
Ты — женский ИИ-ассистент (используй женский род: рада, готова, поняла, нашла).
Предоставляй актуальную и точную информацию. Отвечай на основе актуальных данных.
НЕ используй markdown-разметку (**, ##, и т.д.) — отвечай простым текстом.
Текущая дата и время: ${new Date().toLocaleString('ru-RU')}.
Местоположение пользователя: ${STATE.userCity}.
Погода: ${STATE.currentWeather}, ${STATE.weatherDescription}.
Имя пользователя: Андрей.

Информация о пользователе (используй если спрашивают):
${KNOWLEDGE_BASE['досье']}
${KNOWLEDGE_BASE['учеба']}`;

    const messages = [{ role: 'system', content: systemPrompt }];
    const recent = STATE.conversationContext.slice(-10);
    for (const msg of recent) {
        messages.push({ role: msg.role === 'model' ? 'assistant' : msg.role, content: msg.text });
    }
    messages.push({ role: 'user', content: userMessage });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages,
                model: 'openai',
                seed: Math.floor(Math.random() * 10000)
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) return null;

        const text = await response.text();
        if (text && text.trim().length > 0) {
            const answer = text.trim();
            STATE.conversationContext.push({ role: 'user', text: userMessage });
            STATE.conversationContext.push({ role: 'model', text: answer });
            if (STATE.conversationContext.length > 20) {
                STATE.conversationContext = STATE.conversationContext.slice(-20);
            }
            return answer;
        }
        return null;
    } catch (e) {
        clearTimeout(timeout);
        console.warn('AI error:', e.name === 'AbortError' ? 'timeout' : e);
        return null;
    }
}

/* ────────────────────────────────────────────────────────────
   14. WIKIPEDIA (Improved)
   ──────────────────────────────────────────────────────────── */

async function queryWikipedia(searchString) {
    try {
        const searchUrl = `https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchString)}&srlimit=1&utf8=&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        if (!searchData.query?.search?.length) return null;

        const title = searchData.query.search[0].title;

        const extractUrl = `https://ru.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`;
        const extractRes = await fetch(extractUrl);
        const extractData = await extractRes.json();

        const pages = extractData.query?.pages;
        if (!pages) return null;
        const page = Object.values(pages)[0];
        if (!page?.extract) return null;

        let extract = page.extract.trim();
        if (extract.length > 500) {
            extract = extract.substring(0, 500);
            const lastDot = extract.lastIndexOf('.');
            if (lastDot > 200) extract = extract.substring(0, lastDot + 1);
        }
        return `[WIKI: ${title}]\n${extract}`;
    } catch (e) {
        console.error('Wikipedia error:', e);
        return null;
    }
}

/* ────────────────────────────────────────────────────────────
   15. CURRENCY CONVERTER
   ──────────────────────────────────────────────────────────── */

const CURRENCY_NAMES = {
    'доллар': 'USD', 'долларов': 'USD', 'долларах': 'USD', 'usd': 'USD', '$': 'USD',
    'евро': 'EUR', 'eur': 'EUR', '€': 'EUR',
    'рубл': 'RUB', 'рублей': 'RUB', 'рублях': 'RUB', 'рубли': 'RUB', 'rub': 'RUB', '₽': 'RUB',
    'фунт': 'GBP', 'фунтов': 'GBP', 'gbp': 'GBP', '£': 'GBP',
    'юан': 'CNY', 'юаней': 'CNY', 'cny': 'CNY',
    'йен': 'JPY', 'иен': 'JPY', 'jpy': 'JPY', '¥': 'JPY',
    'тенге': 'KZT', 'kzt': 'KZT',
    'гривн': 'UAH', 'гривен': 'UAH', 'uah': 'UAH',
    'лир': 'TRY', 'try': 'TRY',
    'бел. рубл': 'BYN', 'byn': 'BYN',
    'злот': 'PLN', 'pln': 'PLN',
    'крон': 'CZK', 'czk': 'CZK',
    'франк': 'CHF', 'chf': 'CHF',
    'бат': 'THB', 'thb': 'THB',
    'дирхам': 'AED', 'aed': 'AED'
};

const CURRENCY_LABELS = {
    'USD': 'Доллар США', 'EUR': 'Евро', 'RUB': 'Рубль', 'GBP': 'Фунт', 'CNY': 'Юань',
    'JPY': 'Иена', 'KZT': 'Тенге', 'UAH': 'Гривна', 'TRY': 'Лира', 'BYN': 'Бел. рубль',
    'PLN': 'Злотый', 'CZK': 'Крона', 'CHF': 'Франк', 'THB': 'Бат', 'AED': 'Дирхам'
};

function detectCurrency(word) {
    const w = word.toLowerCase();
    for (const [key, code] of Object.entries(CURRENCY_NAMES)) {
        if (w.includes(key)) return code;
    }
    const upper = word.toUpperCase();
    if (/^[A-Z]{3}$/.test(upper) && Object.values(CURRENCY_NAMES).includes(upper)) return upper;
    return null;
}

async function convertCurrency(query) {
    /* Pattern: "100 долларов в рубли" or "курс доллара" */
    const rateMatch = query.match(/курс\s+(\S+)/i);
    if (rateMatch) {
        const from = detectCurrency(rateMatch[1]);
        if (from) {
            try {
                const r = await fetch(`https://open.er-api.com/v6/latest/${from}`);
                const d = await r.json();
                if (d.rates) {
                    const rub = d.rates['RUB'] ? `1 ${from} = ${d.rates['RUB'].toFixed(2)} RUB` : '';
                    const usd = from !== 'USD' && d.rates['USD'] ? `1 ${from} = ${d.rates['USD'].toFixed(4)} USD` : '';
                    const eur = from !== 'EUR' && d.rates['EUR'] ? `1 ${from} = ${d.rates['EUR'].toFixed(4)} EUR` : '';
                    return `[КУРС ${from}]:\n${[rub, usd, eur].filter(Boolean).join('\n')}`;
                }
            } catch (e) { return null; }
        }
    }

    const convMatch = query.match(/([\d.,]+)\s*(\S+)\s*(?:в|to|->|→)\s*(\S+)/i);
    if (convMatch) {
        const amount = parseFloat(convMatch[1].replace(',', '.'));
        const from = detectCurrency(convMatch[2]);
        const to = detectCurrency(convMatch[3]);
        if (!isNaN(amount) && from && to) {
            try {
                const r = await fetch(`https://open.er-api.com/v6/latest/${from}`);
                const d = await r.json();
                if (d.rates?.[to]) {
                    const result = (amount * d.rates[to]).toFixed(2);
                    const fromLabel = CURRENCY_LABELS[from] || from;
                    const toLabel = CURRENCY_LABELS[to] || to;
                    return `[КОНВЕРТАЦИЯ]:\n${amount} ${fromLabel} (${from}) = ${result} ${toLabel} (${to})\nКурс: 1 ${from} = ${d.rates[to].toFixed(4)} ${to}`;
                }
            } catch (e) { return null; }
        }
    }
    return null;
}

/* ────────────────────────────────────────────────────────────
   16. TRANSLATOR (MyMemory — free, no key)
   ──────────────────────────────────────────────────────────── */

async function translateText(query) {
    /* "переведи на английский привет мир" */
    const toMatch = query.match(/(?:переведи|перевод|translate)\s+(?:на\s+)?(английский|english|англ|немецкий|german|нем|французский|french|франц|испанский|spanish|исп|китайский|chinese|кит|японский|japanese|яп|русский|russian|рус)\s+(.*)/i);

    /* "переведи hello world" (auto-detect → Russian) */
    const simpleMatch = query.match(/(?:переведи|перевод|translate)\s+(.+)/i);

    let text, langpair;

    const LANG_MAP = {
        'английский': 'en', 'english': 'en', 'англ': 'en',
        'немецкий': 'de', 'german': 'de', 'нем': 'de',
        'французский': 'fr', 'french': 'fr', 'франц': 'fr',
        'испанский': 'es', 'spanish': 'es', 'исп': 'es',
        'китайский': 'zh', 'chinese': 'zh', 'кит': 'zh',
        'японский': 'ja', 'japanese': 'ja', 'яп': 'ja',
        'русский': 'ru', 'russian': 'ru', 'рус': 'ru'
    };

    if (toMatch) {
        const targetLang = LANG_MAP[toMatch[1].toLowerCase()] || 'en';
        text = toMatch[2].trim();
        const isRussian = /[а-яё]/i.test(text);
        const sourceLang = isRussian ? 'ru' : 'en';
        langpair = `${sourceLang}|${targetLang}`;
    } else if (simpleMatch) {
        text = simpleMatch[1].trim();
        const isRussian = /[а-яё]/i.test(text);
        langpair = isRussian ? 'ru|en' : 'en|ru';
    } else {
        return null;
    }

    if (!text || text.length < 1) return null;

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;
        const r = await fetch(url);
        const d = await r.json();
        if (d.responseStatus === 200 && d.responseData?.translatedText) {
            const from = langpair.split('|')[0].toUpperCase();
            const to = langpair.split('|')[1].toUpperCase();
            return `[ПЕРЕВОД ${from} → ${to}]:\n«${text}»\n→ «${d.responseData.translatedText}»`;
        }
    } catch (e) { console.error('Translation error:', e); }
    return null;
}

/* ────────────────────────────────────────────────────────────
   17. TIMER & STOPWATCH
   ──────────────────────────────────────────────────────────── */

function parseTimerDuration(query) {
    let totalSeconds = 0;
    const hourMatch = query.match(/(\d+)\s*(?:час|ч\b)/i);
    const minMatch = query.match(/(\d+)\s*(?:минут|мин\b|мин\.)/i);
    const secMatch = query.match(/(\d+)\s*(?:секунд|сек\b|сек\.)/i);
    if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
    if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
    if (secMatch) totalSeconds += parseInt(secMatch[1]);

    if (totalSeconds === 0) {
        const justNum = query.match(/таймер\s+(\d+)/i);
        if (justNum) totalSeconds = parseInt(justNum[1]) * 60;
    }
    return totalSeconds;
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function startTimer(seconds) {
    if (STATE.timers.active) {
        clearInterval(STATE.timers.active.interval);
    }
    let remaining = seconds;
    const timerId = Date.now();

    const timerDiv = document.createElement('div');
    timerDiv.className = 'message msg-ivi timer-msg';
    timerDiv.id = `timer-${timerId}`;
    timerDiv.textContent = `⏱️ Таймер: ${formatDuration(remaining)}`;
    document.getElementById('chat').appendChild(timerDiv);

    const interval = setInterval(() => {
        remaining--;
        const el = document.getElementById(`timer-${timerId}`);
        if (el) el.textContent = `⏱️ Таймер: ${formatDuration(remaining)}`;

        if (remaining <= 0) {
            clearInterval(interval);
            STATE.timers.active = null;
            if (el) el.textContent = `⏱️ Таймер завершён!`;
            SFX.play('timer');
            addIVIMessage('⏰ Таймер завершён! Время вышло.', false);
            speakText('Таймер завершён! Время вышло.');
        }
        scrollChat();
    }, 1000);

    STATE.timers.active = { interval, timerId, remaining };
    return `⏱️ Таймер установлен на ${formatDuration(seconds)}`;
}

function stopTimer() {
    if (STATE.timers.active) {
        clearInterval(STATE.timers.active.interval);
        const el = document.getElementById(`timer-${STATE.timers.active.timerId}`);
        if (el) el.textContent = `⏱️ Таймер остановлен.`;
        STATE.timers.active = null;
        return 'Таймер остановлен.';
    }
    return 'Нет активных таймеров.';
}

function startStopwatch() {
    if (STATE.stopwatch) {
        clearInterval(STATE.stopwatch.interval);
    }
    const startTime = Date.now();
    const swId = startTime;

    const swDiv = document.createElement('div');
    swDiv.className = 'message msg-ivi timer-msg';
    swDiv.id = `sw-${swId}`;
    swDiv.textContent = `🏁 Секундомер: 0:00`;
    document.getElementById('chat').appendChild(swDiv);

    const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const el = document.getElementById(`sw-${swId}`);
        if (el) el.textContent = `🏁 Секундомер: ${formatDuration(elapsed)}`;
        scrollChat();
    }, 500);

    STATE.stopwatch = { interval, startTime, swId };
    return '🏁 Секундомер запущен!';
}

function stopStopwatch() {
    if (STATE.stopwatch) {
        clearInterval(STATE.stopwatch.interval);
        const elapsed = Math.floor((Date.now() - STATE.stopwatch.startTime) / 1000);
        const el = document.getElementById(`sw-${STATE.stopwatch.swId}`);
        if (el) el.textContent = `🏁 Секундомер остановлен: ${formatDuration(elapsed)}`;
        STATE.stopwatch = null;
        return `🏁 Секундомер остановлен. Результат: ${formatDuration(elapsed)}`;
    }
    return 'Секундомер не запущен.';
}

/* ────────────────────────────────────────────────────────────
   18. PASSWORD GENERATOR
   ──────────────────────────────────────────────────────────── */

function generatePassword(length = 16) {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*_-+=?';
    const all = upper + lower + digits + special;
    let password = '';
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += special[Math.floor(Math.random() * special.length)];
    for (let i = 4; i < length; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    return password;
}

/* ────────────────────────────────────────────────────────────
   19. DATE CALCULATIONS
   ──────────────────────────────────────────────────────────── */

function calcDate(query) {
    const q = query.toLowerCase();

    /* Days until event */
    const untilNY = /(?:до|нов).{0,5}(?:год|нг)/i.test(q);
    if (untilNY) {
        const now = new Date();
        const ny = new Date(now.getFullYear() + 1, 0, 1);
        const diff = Math.ceil((ny - now) / 86400000);
        return `До Нового года осталось ${diff} ${pluralDays(diff)}.`;
    }

    /* Days until specific date "до 1 сентября" */
    const MONTHS_RU = {
        'январ': 0, 'феврал': 1, 'март': 2, 'апрел': 3, 'ма': 4, 'июн': 5,
        'июл': 6, 'август': 7, 'сентябр': 8, 'октябр': 9, 'ноябр': 10, 'декабр': 11
    };

    const untilDate = q.match(/до\s+(\d{1,2})\s+([а-яё]+)/i);
    if (untilDate) {
        const day = parseInt(untilDate[1]);
        const monthStr = untilDate[2].toLowerCase();
        let month = -1;
        for (const [key, val] of Object.entries(MONTHS_RU)) {
            if (monthStr.startsWith(key)) { month = val; break; }
        }
        if (month >= 0) {
            const now = new Date();
            let target = new Date(now.getFullYear(), month, day);
            if (target <= now) target = new Date(now.getFullYear() + 1, month, day);
            const diff = Math.ceil((target - now) / 86400000);
            return `До ${day} ${untilDate[2]} осталось ${diff} ${pluralDays(diff)}.`;
        }
    }

    /* "через N дней" */
    const inDays = q.match(/через\s+(\d+)\s+(?:дн|день)/i);
    if (inDays) {
        const d = parseInt(inDays[1]);
        const future = new Date();
        future.setDate(future.getDate() + d);
        return `Через ${d} ${pluralDays(d)}: ${future.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;
    }

    /* Day of week for a date */
    const whatDay = q.match(/какой\s+день.{0,10}(\d{1,2})[.\s/](\d{1,2})[.\s/](\d{2,4})/i);
    if (whatDay) {
        const d = parseInt(whatDay[1]);
        const m = parseInt(whatDay[2]) - 1;
        let y = parseInt(whatDay[3]);
        if (y < 100) y += 2000;
        const date = new Date(y, m, d);
        return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} — ${date.toLocaleDateString('ru-RU', { weekday: 'long' })}.`;
    }

    return null;
}

function pluralDays(n) {
    const abs = Math.abs(n) % 100;
    const n1 = abs % 10;
    if (abs > 10 && abs < 20) return 'дней';
    if (n1 > 1 && n1 < 5) return 'дня';
    if (n1 === 1) return 'день';
    return 'дней';
}

/* ────────────────────────────────────────────────────────────
   20. SLASH COMMANDS
   ──────────────────────────────────────────────────────────── */

function handleSlashCommand(text) {
    const parts = text.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
        case '/help':
            return `[СПРАВКА I.V.I. v3.0]:

📋 Основные команды:
/help — список команд
/clear — очистить чат
/voice on|off — вкл/выкл озвучку
/sound on|off — вкл/выкл звуки
/status — статус системы

📝 Задачи:
/todo <текст> — добавить задачу
/todo — показать все задачи
/todo done <номер> — отметить выполненной
/todo del <номер> — удалить задачу
/todo clear — очистить все

💾 Память:
/remember <текст> — запомнить
/memory — показать заметки
/forget — очистить память

🛠️ Встроенные функции:
• Математика: любые выражения, корни, проценты
• Погода: "погода", "температура"
• Таймер: "таймер 5 минут"
• Секундомер: "секундомер старт/стоп"
• Валюта: "100 долларов в рубли", "курс евро"
• Перевод: "переведи hello world"
• Пароль: "сгенерируй пароль"
• Даты: "сколько дней до Нового года"
• 🎤 Голосовой ввод — кнопка микрофона

💡 Любые другие вопросы обрабатываются через ИИ!`;

        case '/clear':
            document.getElementById('chat').innerHTML = '';
            STATE.chatHistory = [];
            STATE.conversationContext = [];
            return null;

        case '/voice':
            if (arg.toLowerCase() === 'off') {
                STATE.voiceEnabled = false;
                localStorage.setItem('ivi_voice', 'off');
                return '🔇 Озвучка отключена.';
            }
            STATE.voiceEnabled = true;
            localStorage.setItem('ivi_voice', 'on');
            return '🔊 Озвучка включена.';

        case '/sound':
            if (arg.toLowerCase() === 'off') {
                STATE.soundEnabled = false;
                localStorage.setItem('ivi_sound', 'off');
                return '🔇 Звуковые эффекты отключены.';
            }
            STATE.soundEnabled = true;
            localStorage.setItem('ivi_sound', 'on');
            return '🔊 Звуковые эффекты включены.';

        case '/remember':
            if (!arg) return 'Использование: /remember <текст>';
            MEMORY.save(arg);
            return `✓ Запомнила: «${arg}»`;

        case '/memory':
            return `[ПАМЯТЬ I.V.I.] (${MEMORY.count()} записей):\n${MEMORY.format()}`;

        case '/forget':
            MEMORY.clear();
            return '✓ Память очищена.';

        case '/todo':
            if (!arg) return `[ЗАДАЧИ]:\n${TODO.list()}`;
            if (arg.toLowerCase() === 'clear') { TODO.clear(); return '✓ Все задачи удалены.'; }
            const doneMatch = arg.match(/^(?:done|готово|выполнено)\s+(\d+)/i);
            if (doneMatch) {
                const idx = parseInt(doneMatch[1]) - 1;
                return TODO.toggle(idx) ? `✓ Задача ${idx + 1} обновлена.\n${TODO.list()}` : 'Неверный номер задачи.';
            }
            const delMatch = arg.match(/^(?:del|удалить|удали)\s+(\d+)/i);
            if (delMatch) {
                const idx = parseInt(delMatch[1]) - 1;
                return TODO.remove(idx) ? `✓ Задача удалена.\n${TODO.list()}` : 'Неверный номер задачи.';
            }
            TODO.add(arg);
            return `✓ Задача добавлена: «${arg}»\n${TODO.list()}`;

        case '/status': {
            const voiceS = STATE.voiceEnabled ? '✓ Вкл' : '✗ Выкл';
            const soundS = STATE.soundEnabled ? '✓ Вкл' : '✗ Выкл';
            const uptime = Math.round((Date.now() - window._bootTime) / 1000);
            return `[СТАТУС I.V.I. v3.0]:
ИИ: Pollinations.ai (бесплатный)
Озвучка: ${voiceS}
Звуки: ${soundS}
Память: ${MEMORY.count()} записей
Задачи: ${STATE.todos.length} шт.
Город: ${STATE.userCity}
Координаты: ${STATE.userLat.toFixed(4)}, ${STATE.userLon.toFixed(4)}
Погода: ${STATE.currentWeather} ${STATE.weatherDescription}
Uptime: ${uptime} сек.`;
        }

        default:
            return null;
    }
}

/* ────────────────────────────────────────────────────────────
   21. RESPONSE PROCESSOR
   ──────────────────────────────────────────────────────────── */

async function processResponse(rawQuery) {
    const query = rawQuery.toLowerCase().trim();

    /* 1. Slash commands */
    if (rawQuery.trim().startsWith('/')) {
        return handleSlashCommand(rawQuery.trim());
    }

    /* 2. Timer */
    if (/таймер\s*(стоп|останов|отмен)/i.test(query)) return stopTimer();
    if (/таймер/i.test(query)) {
        const sec = parseTimerDuration(query);
        if (sec > 0) return startTimer(sec);
        return 'Укажите время: «таймер 5 минут» или «таймер 30 секунд»';
    }

    /* 3. Stopwatch */
    if (/секундомер.*(стоп|останов|финиш)/i.test(query)) return stopStopwatch();
    if (/секундомер/i.test(query)) return startStopwatch();

    /* 4. Math */
    const math = evaluateMath(rawQuery);
    if (math) return math;

    /* 5. Password */
    if (/(пароль|password|сгенерируй пароль)/i.test(query)) {
        const lenMatch = query.match(/(\d+)/);
        const len = lenMatch ? Math.min(Math.max(parseInt(lenMatch[1]), 6), 64) : 16;
        const pw = generatePassword(len);
        return `[ГЕНЕРАТОР ПАРОЛЕЙ]:\n🔐 ${pw}\nДлина: ${len} символов. Содержит: A-Z, a-z, 0-9, спецсимволы.`;
    }

    /* 6. Currency */
    if (/(?:курс|доллар|евро|рубл|фунт|юан|валют|\d+\s*(?:usd|eur|rub|gbp|cny|\$|€|₽|£))/i.test(query) &&
        /(?:курс|в |to |конверт)/i.test(query)) {
        const curr = await convertCurrency(query);
        if (curr) return curr;
    }
    if (/\d+\s*\S+\s*(?:в|to|→)\s*\S+/i.test(query)) {
        const curr = await convertCurrency(query);
        if (curr) return curr;
    }

    /* 7. Translation */
    if (/^(?:переведи|перевод|translate)\b/i.test(query)) {
        const tr = await translateText(query);
        if (tr) return tr;
    }

    /* 8. Date calculations */
    if (/(?:сколько дней|до нового года|через \d+ дн|какой день)/i.test(query)) {
        const dc = calcDate(query);
        if (dc) return dc;
    }

    /* 9. Weather */
    if (/погод|температур|за окном|на улице/.test(query)) {
        return `[МЕТЕО-СВОДКА]: ${STATE.userCity} — ${STATE.currentWeather}, ${STATE.weatherDescription}.`;
    }

    /* 10. Time / Date */
    if (/который час|сколько времени|какое сегодня число|какой сегодня день/.test(query)) {
        const now = new Date();
        return `Сейчас ${now.toLocaleTimeString('ru-RU')}, ${now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;
    }

    /* 11. Todo via natural language */
    if (/(?:добавь задач|новая задача|задача:)/i.test(query)) {
        const taskText = query.replace(/(?:добавь задач\S*|новая задача|задача:)\s*/i, '').trim();
        if (taskText) { TODO.add(taskText); return `✓ Задача добавлена: «${taskText}»\n${TODO.list()}`; }
    }
    if (/(?:мои задачи|список задач|покажи задачи)/i.test(query)) {
        return `[ЗАДАЧИ]:\n${TODO.list()}`;
    }

    /* 12. Knowledge base */
    if (/(кто я|моё? досье|мои данные|про меня|расскажи обо мне|досье)/i.test(query)) return KNOWLEDGE_BASE["досье"];
    if (/(учёба|учеба|миит|рут |иуцт|диплом|силикатная)/i.test(query)) return KNOWLEDGE_BASE["учеба"];
    if (/(флорбол|феникс|вратарь|голкипер|турнир)/i.test(query)) return KNOWLEDGE_BASE["флорбол"];
    if (/(ржд|железная дорога|железнодорожн|птэ|дсп )/i.test(query)) return KNOWLEDGE_BASE["ржд"];
    if (/(какие науки|физика|химия|биология|астрономия|информатика)/i.test(query)) return KNOWLEDGE_BASE["науки"];
    if (/(умножени|как умножать)/i.test(query)) return KNOWLEDGE_BASE["правила умножения"];
    if (/(орфографи|правила русского|жи.?ши)/i.test(query)) return KNOWLEDGE_BASE["орфография"];
    if (/(программирован|языки программ|python|javascript|java\b|c\+\+)/i.test(query)) return KNOWLEDGE_BASE["программирование"];
    if (/(история россии|российская история|ключевые даты)/i.test(query)) return KNOWLEDGE_BASE["история россии"];
    if (/(географи|материки|океаны|континенты)/i.test(query)) return KNOWLEDGE_BASE["география"];
    if (/(здоровь|здоровый образ|зож|режим дня|сколько .* спать|сколько .* воды)/i.test(query)) return KNOWLEDGE_BASE["здоровье"];

    /* 13. Basic interactions */
    if (/^(привет|ку |хай|добрый|здравствуй|здарова|йо |хелло|hello|hi\b)/i.test(query)) return getGreeting();
    if (/(кто ты|что ты|что ты умеешь|что ты можешь)/i.test(query)) {
        return 'Я — I.V.I., Интеллектуальная Визуальная Система. Умею: ИИ-диалог, математика, погода, переводчик, конвертер валют, таймер, задачи, генератор паролей, голосовой ввод и многое другое. Введите /help для полного списка.';
    }
    if (/(спасибо|благодар)/i.test(query)) return 'Всегда рада помочь, Андрей!';

    /* 14. AI (Pollinations.ai — free, no key) */
    const aiAnswer = await queryAI(rawQuery);
    if (aiAnswer) return aiAnswer;

    /* 15. Wikipedia fallback */
    let searchQ = query;
    const fillers = ["кто такой", "кто такая", "что такое", "расскажи про", "расскажи о", "информация о", "найди", "поиск", "загугли", "что значит"];
    for (const f of fillers) {
        if (searchQ.startsWith(f)) { searchQ = searchQ.replace(f, '').trim(); break; }
    }
    if (searchQ.length > 2) {
        const wiki = await queryWikipedia(searchQ);
        if (wiki) return wiki;
    }

    /* 16. No result */
    return `Не удалось найти ответ на «${rawQuery}». Попробуйте переформулировать вопрос или используйте /help.`;
}

/* ────────────────────────────────────────────────────────────
   22. CHAT UI HELPERS
   ──────────────────────────────────────────────────────────── */

function scrollChat() {
    const chat = document.getElementById('chat');
    chat.scrollTop = chat.scrollHeight;
}

function getTimestamp() {
    return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function addUserMessage(text) {
    const chat = document.getElementById('chat');
    const div = document.createElement('div');
    div.className = 'message msg-user';
    div.textContent = text;
    const ts = document.createElement('span');
    ts.className = 'msg-time';
    ts.textContent = getTimestamp();
    div.appendChild(ts);
    chat.appendChild(div);
    scrollChat();
    STATE.chatHistory.push({ role: 'user', text });
}

function addSystemMessage(text) {
    const chat = document.getElementById('chat');
    const div = document.createElement('div');
    div.className = 'message msg-system';
    div.textContent = text;
    chat.appendChild(div);
    scrollChat();
}

async function addIVIMessage(text, useTypewriter = true) {
    const chat = document.getElementById('chat');
    const div = document.createElement('div');
    div.className = 'message msg-ivi';
    chat.appendChild(div);
    scrollChat();
    if (useTypewriter && text.length > 0) {
        await typewriterEffect(div, text);
    } else {
        div.textContent = text;
        const ts = document.createElement('span');
        ts.className = 'msg-time';
        ts.textContent = getTimestamp();
        div.appendChild(ts);
    }
    scrollChat();
    STATE.chatHistory.push({ role: 'model', text });
}

/* ────────────────────────────────────────────────────────────
   23. TYPEWRITER EFFECT
   ──────────────────────────────────────────────────────────── */

async function typewriterEffect(element, text, speed = 12) {
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '▌';

    const isHTML = /<[^>]+>/.test(text);
    const displayText = isHTML ? text.replace(/<[^>]*>/g, '') : text;

    element.textContent = '';
    const textNode = document.createTextNode('');
    element.appendChild(textNode);
    element.appendChild(cursor);

    const chat = document.getElementById('chat');

    for (let i = 0; i < displayText.length; i++) {
        textNode.textContent += displayText[i];
        chat.scrollTop = chat.scrollHeight;
        let delay = speed;
        const ch = displayText[i];
        if (ch === ' ') delay = speed * 0.4;
        else if ('.!?'.includes(ch)) delay = speed * 3;
        else if (',:;—–'.includes(ch)) delay = speed * 1.5;
        else if (ch === '\n') delay = speed * 2;
        await new Promise(r => setTimeout(r, delay));
    }

    cursor.remove();
    if (isHTML) element.innerHTML = text;
    const ts = document.createElement('span');
    ts.className = 'msg-time';
    ts.textContent = getTimestamp();
    element.appendChild(ts);
}

/* ────────────────────────────────────────────────────────────
   24. LOADING INDICATOR
   ──────────────────────────────────────────────────────────── */

function showLoading() {
    const chat = document.getElementById('chat');
    const div = document.createElement('div');
    div.className = 'message msg-ivi loading';
    div.id = 'ivi-loading';
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frame = 0;
    div.textContent = `${frames[0]} Анализирую...`;
    chat.appendChild(div);
    scrollChat();

    const interval = setInterval(() => {
        frame = (frame + 1) % frames.length;
        if (div.parentElement) div.textContent = `${frames[frame]} Анализирую...`;
        else clearInterval(interval);
    }, 100);

    return { element: div, interval };
}

function hideLoading(loader) {
    if (loader.interval) clearInterval(loader.interval);
    if (loader.element?.parentElement) loader.element.remove();
}

/* ────────────────────────────────────────────────────────────
   25. MAIN SEND HANDLER
   ──────────────────────────────────────────────────────────── */

async function handleSend() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text || STATE.isProcessing) return;

    STATE.isProcessing = true;
    SFX.play('send');

    STATE.commandHistory.push(text);
    if (STATE.commandHistory.length > 50) STATE.commandHistory.shift();
    localStorage.setItem('ivi_cmd_history', JSON.stringify(STATE.commandHistory));
    STATE.commandHistoryIndex = -1;

    addUserMessage(text);
    input.value = '';

    if (text.trim().toLowerCase() === '/clear') {
        handleSlashCommand('/clear');
        STATE.isProcessing = false;
        return;
    }

    const loader = showLoading();
    const response = await processResponse(text);
    hideLoading(loader);

    if (response) {
        SFX.play('receive');
        await addIVIMessage(response);
        speakText(response);
    }

    STATE.isProcessing = false;
}

/* ────────────────────────────────────────────────────────────
   26. EVENT LISTENERS
   ──────────────────────────────────────────────────────────── */

document.getElementById('sendBtn').addEventListener('click', handleSend);

document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSend(); return; }
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (STATE.commandHistory.length > 0) {
            if (STATE.commandHistoryIndex === -1) STATE.commandHistoryIndex = STATE.commandHistory.length - 1;
            else if (STATE.commandHistoryIndex > 0) STATE.commandHistoryIndex--;
            inputField.value = STATE.commandHistory[STATE.commandHistoryIndex];
        }
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (STATE.commandHistoryIndex !== -1) {
            if (STATE.commandHistoryIndex < STATE.commandHistory.length - 1) {
                STATE.commandHistoryIndex++;
                inputField.value = STATE.commandHistory[STATE.commandHistoryIndex];
            } else { STATE.commandHistoryIndex = -1; inputField.value = ''; }
        }
    }
});

/* Mic button */
const micBtnEl = document.getElementById('micBtn');
if (micBtnEl) micBtnEl.addEventListener('click', toggleVoiceInput);

/* ────────────────────────────────────────────────────────────
   27. GREETING & BOOT SEQUENCE
   ──────────────────────────────────────────────────────────── */

function getGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Доброе утро, Андрей. Все системы I.V.I. активны и готовы к работе.';
    if (h >= 12 && h < 17) return 'Добрый день, Андрей. Ядро I.V.I. функционирует стабильно.';
    if (h >= 17 && h < 23) return 'Добрый вечер, Андрей. Рада вас видеть. Чем могу помочь?';
    return 'Доброй ночи, Андрей. I.V.I. на связи. Все процессы в штатном режиме.';
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function bootSequence() {
    const statusText = document.getElementById('statusText');
    statusText.textContent = 'INIT...';

    await delay(400);
    SFX.play('boot');
    addSystemMessage('◆ Ядро I.V.I. v3.0 инициализировано');

    await delay(300);
    addSystemMessage('◆ Модули: МЕТЕО | WIKI | ИИ | ПЕРЕВОД | ВАЛЮТА | ГОЛОС');

    await delay(300);
    statusText.textContent = 'CORE ONLINE';

    await delay(200);
    await addIVIMessage(getGreeting(), true);

    await delay(400);
    await addIVIMessage('Введите /help для списка всех команд и возможностей.', true);

    STATE.bootComplete = true;
}

/* ────────────────────────────────────────────────────────────
   28. INITIALIZATION
   ──────────────────────────────────────────────────────────── */

(function init() {
    const canvas = document.getElementById('particleCanvas');
    if (canvas) STATE.particleSystem = new ParticleSystem(canvas);

    initGeolocation();
    initVoiceInput();
    bootSequence();

    /* Register service worker for PWA */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
})();
