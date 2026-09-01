import React, { useState, useRef, useEffect, forwardRef, useCallback, useMemo } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
    Settings, Home, ArrowLeft, Clock, MapPin, Leaf, Activity, Landmark, ChevronDown,
    XCircle, Star, Heart, CheckCircle, Navigation, PlayCircle,
    Pause, Monitor, Award, Compass, Mail, Bell, Search, Send, Clapperboard,
    Sun, Moon, User, Map as MapIcon, Coffee, Waves, Trees, Mountain,
    Music, BookOpen, Smile, Bike, Globe, Building, Download, Loader
} from "lucide-react";

// ==========================================
// КОНФИГУРАЦИЯ СЕРВЕРА
// ==========================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyVujXF3Sil6nveHdaMks56roSL0t4HejMs65EyoEjfx0a4IFLpIXj61QeMTF1_LV1scg/exec';

const apiCall = async (action, params) => {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action, ...params })
        });
        const result = await response.json();  // ← ВОТ ЭТА СТРОКА ДОЛЖНА БЫТЬ ПЕРЕД console.log
        console.log('📥 сервер ответил:', action, result);
        return result;
    } catch (e) {
        console.error('💥 ошибка сети:', e);
        return { success: false, error: 'network_error' };
    }
};


// === СИНХРОНИЗАЦИЯ ДАННЫХ С СЕРВЕРОМ ===
const saveUserDataToServer = async (hash, userData) => {
  try {
    const result = await apiCall('loadUserData', { hash });
    if (result.success && result.data) {
      return result.data;
    }
  } catch (e) {
    console.log('Не удалось загрузить данные с сервера:', e);
  }
  return null;
};
const loadUserDataFromServer = async (hash) => {
  try {
    const result = await apiCall('loadUserData', { hash });
    if (result.success && result.data) {
      return result.data;
    }
  } catch (e) {
    console.log('Не удалось загрузить данные с сервера:', e);
  }
  return null;
};


const hashString = async (str) => {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getDeviceData = () => ({
    os: navigator.userAgent.includes('Android') ? 'Android' :
        navigator.userAgent.includes('iPhone') ? 'iOS' :
        navigator.userAgent.includes('Windows') ? 'Windows' : 'Other',
    browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
             navigator.userAgent.includes('Firefox') ? 'Firefox' :
             navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
    language: navigator.language || '',
    screen: `${window.screen.width}x${window.screen.height}`,
});
// ==========================================
// УЛЬТРАСОВРЕМЕННЫЙ ЭКРАН ЗДОРОВЬЯ (Premium Health UI)

const HealthDashboardScreen = ({ darkMode, onComplete, lang = 'ru', locations = [], currentPosition, steps, calories, weather }) => {
    const stepGoal = 10000;
    const calorieGoal = 400;
    const displaySteps = steps || 0;
    const displayCalories = calories || 0;
    const stepsPercent = Math.min((displaySteps / stepGoal) * 100, 100);
    const caloriesPercent = Math.min((displayCalories / calorieGoal) * 100, 100);
    const currentHour = new Date().getHours();
    const hoursLeft = Math.max(24 - currentHour, 1);
    const stepsPerHour = currentHour > 0 ? displaySteps / currentHour : 0;
    const predictedSteps = displaySteps > 100 
        ? Math.round(displaySteps + stepsPerHour * hoursLeft) 
        : Math.round(stepGoal * 0.7);
    const ringRadius = 42;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const stepsOffset = ringCircumference - (ringCircumference * stepsPercent) / 100;
    const innerRadius = 30;
    const innerCircumference = 2 * Math.PI * innerRadius;
    const calOffset = innerCircumference - (innerCircumference * caloriesPercent) / 100;

    const getWeatherEmoji = (desc) => {
        if (!desc) return '🌤️';
        const d = desc.toLowerCase();
        if (d.includes('ясно') || d.includes('clear')) return '☀️';
        if (d.includes('облач') || d.includes('cloud') || d.includes('пасмурно')) return '☁️';
        if (d.includes('дожд') || d.includes('rain') || d.includes('ливень')) return '🌧️';
        if (d.includes('снег') || d.includes('snow')) return '❄️';
        if (d.includes('гроза') || d.includes('thunder')) return '⛈️';
        if (d.includes('туман') || d.includes('fog')) return '🌫️';
        return '🌤️';
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (lang === 'en') {
            if (h < 6) return 'Good night';
            if (h < 12) return 'Good morning';
            if (h < 18) return 'Good afternoon';
            return 'Good evening';
        }
        if (lang === 'de') {
            if (h < 6) return 'Gute Nacht';
            if (h < 12) return 'Guten Morgen';
            if (h < 18) return 'Guten Tag';
            return 'Guten Abend';
        }
        if (h < 6) return 'Доброй ночи';
        if (h < 12) return 'Доброе утро';
        if (h < 18) return 'Добрый день';
        return 'Добрый вечер';
    };

    const t = {
        ru: {
            greeting: getGreeting(), subtitle: "Ваш день в движении",
            steps: "Шаги", calories: "Калории", of: "из", kcal: "ккал", goal: "цель",
            forecast: "Прогноз на день", forecastSteps: "шагов к концу дня",
            weatherTitle: "Погода сейчас", nearbyTitle: "Интересное рядом",
            meters: "м", km: "км", btn: "Начать исследовать",
            noData: "Начните ходить — данные появятся", loading: "Определяем ваше местоположение..."
        },
        en: {
            greeting: getGreeting(), subtitle: "Your day in motion",
            steps: "Steps", calories: "Calories", of: "of", kcal: "kcal", goal: "goal",
            forecast: "Today's forecast", forecastSteps: "steps by end of day",
            weatherTitle: "Weather now", nearbyTitle: "Interesting nearby",
            meters: "m", km: "km", btn: "Start exploring",
            noData: "Start walking — data will appear", loading: "Finding your location..."
        },
        de: {
            greeting: getGreeting(), subtitle: "Ihr Tag in Bewegung",
            steps: "Schritte", calories: "Kalorien", of: "von", kcal: "kcal", goal: "Ziel",
            forecast: "Tagesprognose", forecastSteps: "Schritte bis Tagesende",
            weatherTitle: "Wetter jetzt", nearbyTitle: "Interessantes in der Nähe",
            meters: "m", km: "km", btn: "Erkunden starten",
            noData: "Beginnen Sie zu gehen", loading: "Standort wird ermittelt..."
        },
        hy: {
            greeting: getGreeting(), subtitle: "Ձեր օրը շարժման մdelays",
            steps: "Քայլեր", calories: "Կdelays", of: "ից", kcal: " delays", goal: "նdelays",
            forecast: "Delays", forecastSteps: "delays",
            weatherTitle: "Delays", nearbyTitle: "Delays մdelays",
            meters: "մ", km: "delays", btn: "Delays",
            noData: "Delays", loading: "Delays..."
        },
        hi: {
            greeting: getGreeting(), subtitle: "आपका दिन गति में",
            steps: "कदम", calories: "कैलdelay", of: "में से", kcal: "delay", goal: "लdelays",
            forecast: "Delays", forecastSteps: "delays",
            weatherTitle: "Delays", nearbyTitle: "Delays",
            meters: "मीdelay", km: "किdelay", btn: "Delays शुरू करें",
            noData: "Delays", loading: "Delays..."
        }
    }[lang] || {
        greeting: getGreeting(), subtitle: "Ваш день в движении",
        steps: "Шаги", calories: "Калории", of: "из", kcal: "ккал", goal: "цель",
        forecast: "Прогноз на день", forecastSteps: "шагов к концу дня",
        weatherTitle: "Погода сейчас", nearbyTitle: "Интересное рядом",
        meters: "м", km: "км", btn: "Начать исследовать",
        noData: "Начните ходить — данные появятся", loading: "Определяем ваше местоположение..."
    };

    const colors = darkMode ? {
        bg: '#0A0E1A', surface: 'rgba(255,255,255,0.06)', glass: 'rgba(255,255,255,0.08)',
        text: '#F1F5F9', textSecondary: '#94A3B8', textMuted: '#64748B',
        accent: '#10B981', accentGlow: 'rgba(16, 185, 129, 0.3)',
        calColor: '#F59E0B', calGlow: 'rgba(245, 158, 11, 0.3)',
        border: 'rgba(255,255,255,0.08)', cardBg: 'rgba(30, 41, 59, 0.8)',
    } : {
        bg: '#F0F4F8', surface: 'rgba(255,255,255,0.9)', glass: 'rgba(255,255,255,0.7)',
        text: '#0F172A', textSecondary: '#475569', textMuted: '#94A3B8',
        accent: '#10B981', accentGlow: 'rgba(16, 185, 129, 0.15)',
        calColor: '#F59E0B', calGlow: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(0,0,0,0.06)', cardBg: 'rgba(255,255,255,0.95)',
    };

    const nearbyPlaces = useMemo(() => {
        if (locations && locations.length > 0) return locations.slice(0, 4);
        return [];
    }, [locations]);

    const formatDist = (meters) => {
        if (!meters) return '';
        if (meters >= 1000) return `${(meters / 1000).toFixed(1)} ${t.km}`;
        return `${meters} ${t.meters}`;
    };

    const getRouteEmoji = (route) => {
        const sub = (route.subCategory || '').toLowerCase();
        if (sub.includes('набережн')) return '🌊';
        if (sub.includes('музе')) return '🏛️';
        if (sub.includes('памятник') || sub.includes('мемориал')) return '🗿';
        if (sub.includes('архитектур')) return '🏗️';
        if (sub.includes('площад')) return '⛲';
        if (sub.includes('церк') || sub.includes('храм')) return '⛪';
        if (sub.includes('парк') || sub.includes('природ')) return '🌳';
        if (sub.includes('кофе')) return '☕';
        if (sub.includes('скульптур') || sub.includes('искусств')) return '🎨';
        if (sub.includes('тайн') || sub.includes('мистич')) return '🔮';
        if (sub.includes('спорт')) return '⚽';
        if (sub.includes('легенд') || sub.includes('миф')) return '📜';
        return '📍';
    };

    return (
        <div style={{
            padding: '0 0 140px 0', backgroundColor: colors.bg, color: colors.text,
            minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box', overflowX: 'hidden',
        }}>
            {/* HEADER */}
            <div style={{
                background: darkMode 
                    ? 'linear-gradient(135deg, #064E3B 0%, #0A0E1A 60%)' 
                    : 'linear-gradient(135deg, #D1FAE5 0%, #F0F4F8 60%)',
                padding: '50px 24px 40px 24px',
                borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: darkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)' }} />
                <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: darkMode ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.1)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: '14px', color: colors.accent, fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px', textTransform: 'uppercase' }}>
                        {t.greeting} 👋
                    </p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                        {t.subtitle}
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '28px' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="60" cy="60" r={ringRadius} stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth="10" fill="transparent" />
                            <circle cx="60" cy="60" r={ringRadius} stroke={colors.accent} strokeWidth="10" fill="transparent" strokeDasharray={ringCircumference} strokeDashoffset={stepsOffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${colors.accentGlow})` }} />
                            <circle cx="60" cy="60" r={innerRadius} stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth="8" fill="transparent" />
                            <circle cx="60" cy="60" r={innerRadius} stroke={colors.calColor} strokeWidth="8" fill="transparent" strokeDasharray={innerCircumference} strokeDashoffset={calOffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${colors.calGlow})` }} />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>
                                {displaySteps > 0 ? displaySteps.toLocaleString() : '—'}
                            </div>
                            <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 600, marginTop: '2px' }}>{t.steps}</div>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.accent, boxShadow: `0 0 8px ${colors.accentGlow}` }} />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>{t.steps}</span>
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 900 }}>{displaySteps > 0 ? displaySteps.toLocaleString() : '—'}</div>
                            <div style={{ fontSize: '11px', color: colors.textMuted }}>{t.goal}: {stepGoal.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.calColor, boxShadow: `0 0 8px ${colors.calGlow}` }} />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>{t.calories}</span>
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 900 }}>
                                {displayCalories > 0 ? displayCalories : '—'}
                                <span style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 500, marginLeft: '4px' }}>{t.kcal}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {displaySteps === 0 && (
                    <div style={{ marginTop: '16px', padding: '10px 16px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: '12px', fontSize: '13px', color: colors.textMuted, textAlign: 'center' }}>
                        👟 {t.noData}
                    </div>
                )}
            </div>

            <div style={{ padding: '20px 20px 0 20px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, padding: '16px', background: colors.cardBg, borderRadius: '20px', border: `1px solid ${colors.border}`, backdropFilter: 'blur(20px)' }}>
                        <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📈 {t.forecast}</div>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: colors.accent, marginTop: '8px' }}>{predictedSteps > 0 ? `~${predictedSteps.toLocaleString()}` : '—'}</div>
                        <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>{t.forecastSteps}</div>
                    </div>
                    <div style={{ flex: 1, padding: '16px', background: colors.cardBg, borderRadius: '20px', border: `1px solid ${colors.border}`, backdropFilter: 'blur(20px)' }}>
                        <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{getWeatherEmoji(weather?.desc)} {t.weatherTitle}</div>
                        <div style={{ fontSize: '22px', fontWeight: 900, marginTop: '8px' }}>{weather ? weather.temp : '—°C'}</div>
                        <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{weather ? weather.desc : '...'}</div>
                    </div>
                </div>

                {nearbyPlaces.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '20px' }}>📍</span> {t.nearbyTitle}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {nearbyPlaces.map((loc, idx) => (
                                <div key={idx} style={{ background: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '12px', padding: '0', backdropFilter: 'blur(20px)', cursor: 'pointer' }}>
                                    {loc.image ? (
                                        <img src={loc.image} alt={loc.name || loc.title} style={{ width: '72px', height: '72px', objectFit: 'cover', flexShrink: 0, borderRadius: '16px 0 0 16px' }} />
                                    ) : (
                                        <div style={{ width: '72px', height: '72px', flexShrink: 0, background: darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', borderRadius: '16px 0 0 16px' }}>
                                            {getRouteEmoji(loc)}
                                        </div>
                                    )}
                                    <div style={{ flex: 1, padding: '12px 14px 12px 0', minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {loc.name || loc.title}
                                        </div>
                                        {loc.subCategory && (
                                            <div style={{ fontSize: '11px', color: colors.accent, fontWeight: 600, marginTop: '2px' }}>{loc.subCategory}</div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                                            {loc.dist !== undefined && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>📏 {formatDist(loc.dist)}</span>}
                                            {loc.time && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>🕐 {loc.time}</span>}
                                        </div>
                                    </div>
                                    <div style={{ paddingRight: '14px', color: colors.accent, fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>→</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {nearbyPlaces.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', background: colors.cardBg, borderRadius: '20px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗺️</div>
                        <div style={{ fontSize: '14px', color: colors.textMuted }}>{t.loading}</div>
                    </div>
                )}
            </div>

        </div>
    );
};

// 1. СТИЛИ И НАСТРОЙКИ (Styles & Config)
//

const THEME = {
    light: {
        bg: '#F3F4F6',
        surface: '#FFFFFF',
        text: '#1F2937',
        textMuted: '#6B7280',
        primary: '#10B981',
        border: '#E5E7EB',
        cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    },
    dark: {
        bg: '#111827',
        surface: '#1F2937',
        text: '#F9FAFB',
        textMuted: '#9CA3AF',
        primary: '#34D399',
        border: '#374151',
        cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    }
};

const S = {
    flex: { display: 'flex' },
    itemsCenter: { alignItems: 'center' },
    justifyContent: { justifyContent: 'space-between' },
    justifyCenter: { justifyContent: 'center' },
    textCenter: { textAlign: 'center' },
    wFull: { width: '100%' },
    p4: { padding: '1rem' },
    p6: { padding: '1.5rem' },
    py3: { paddingTop: '0.875rem', paddingBottom: '0.875rem' },
    px6: { paddingLeft: '1.5rem', paddingRight: '1.5rem' },
    roundedXl: { borderRadius: '1rem' },
    rounded2xl: { borderRadius: '1.5rem' },
    roundedFull: { borderRadius: '9999px' },
    fontSemibold: { fontWeight: 600 },
    fontBold: { fontWeight: 800 },
    textLg: { fontSize: '1.125rem' },
    textXl: { fontSize: '1.25rem', lineHeight: '1.75rem' },
    emerald600: '#059669',
    emerald700: '#047857',
    sky600: '#0284c7',
    red500: '#ef4444',
    orange500: '#f97316',
    dark: {
        bg: THEME.dark.bg,
        text: THEME.dark.text,
        cardBg: THEME.dark.surface,
        cardBorder: THEME.dark.border,
        textMuted: THEME.dark.textMuted,
        buttonBg: THEME.dark.primary,
        shadow: THEME.dark.cardShadow
    },
    light: {
        bg: THEME.light.bg,
        text: THEME.light.text,
        cardBg: THEME.light.surface,
        cardBorder: THEME.light.border,
        textMuted: THEME.light.textMuted,
        buttonBg: THEME.light.primary,
        shadow: THEME.light.cardShadow
    }
};

const cardStyle = {
    padding: '1rem',
    borderRadius: '1.25rem',
    border: '1px solid',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    overflow: 'hidden',
    transform: 'translateZ(0)',
    boxSizing: 'border-box',
    transition: 'transform 0.1s ease-in-out, box-shadow 0.2s ease',
    position: 'relative'
};

// --- ФУНКЦИЯ ПОЛУЧЕНИЯ СТИЛЕЙ КАТЕГОРИЙ (ИКОНКИ) ---
// --- ФУНКЦИЯ ПОЛУЧЕНИЯ СТИЛЕЙ КАТЕГОРИЙ (ИКОНКИ) ---
const getCategoryStyle = (subCategoryName) => {
    // 1. Дефолтный стиль (если иконка не найдена)
    const defaultStyle = {
        iconComp: <MapPin size={20} color="#6B7280" />,
        svgString: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'
    };

    // 2. Хелпер для SVG (для маркеров на карте)
    const createSvg = (color, path) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

    // 3. СЛОВАРЬ СТИЛЕЙ (Все 34 категории из CATALOG_STRUCTURE)
    const styles = {
        // === КУЛЬТУРНЫЕ И ИСТОРИЧЕСКИЕ ===
        "Набережная": {
            iconComp: <Waves size={20} color="#3b82f6" />,
            svgString: createSvg('#3b82f6', '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>')
        },
        "Музеи и выставки": {
            iconComp: <Landmark size={20} color="#a855f7" />,
            svgString: createSvg('#a855f7', '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>')
        },
        "Памятники и мемориалы": {
            iconComp: <Award size={20} color="#ef4444" />,
            svgString: createSvg('#ef4444', '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>')
        },
        "Архитектурные достопримечательности": {
            iconComp: <Building size={20} color="#f97316" />,
            svgString: createSvg('#f97316', '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22"/><line x1="15" y1="22" x2="15" y2="22"/>')
        },
        "Городские площади": {
            iconComp: <MapIcon size={20} color="#ef4444" />,
            svgString: createSvg('#ef4444', '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>')
        },
        "Исторические кварталы": {
            iconComp: <Building size={20} color="#92400e" />,
            svgString: createSvg('#92400e', '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>')
        },
        "Церкви и храмы": {
            iconComp: <Sun size={20} color="#eab308" />,
            svgString: createSvg('#eab308', '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>')
        },
        "Легенды и мифы города": {
            iconComp: <BookOpen size={20} color="#8b5cf6" />,
            svgString: createSvg('#8b5cf6', '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>')
        },

        // === ПРИРОДНЫЕ И АКТИВНЫЕ ===
        "Природные зоны и парки": {
            iconComp: <Trees size={20} color="#16a34a" />,
            svgString: createSvg('#16a34a', '<path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .6-1.7L13 3l-1.4 1.5"/>')
        },
        "Горные и лесные маршруты": {
            iconComp: <Mountain size={20} color="#15803d" />,
            svgString: createSvg('#15803d', '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"/>')
        },
        "Активный отдых у воды": {
            iconComp: <Waves size={20} color="#0ea5e9" />,
            svgString: createSvg('#0ea5e9', '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>')
        },
        "Спортивные площадки и фитнес-парки": {
            iconComp: <Activity size={20} color="#dc2626" />,
            svgString: createSvg('#dc2626', '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>')
        },

        // === СОВРЕМЕННЫЕ И УРБАНИСТИЧЕСКИЕ ===
        "Скульптуры и уличное искусство": {
            iconComp: <Smile size={20} color="#f59e0b" />,
            svgString: createSvg('#f59e0b', '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>')
        },
        "Современная архитектура": {
            iconComp: <Building size={20} color="#60a5fa" />,
            svgString: createSvg('#60a5fa', '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>')
        },
        "Городские лаборатории": {
            iconComp: <Monitor size={20} color="#6b7280" />,
            svgString: createSvg('#6b7280', '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>')
        },
        "Реставрации и обновления": {
            iconComp: <Settings size={20} color="#9ca3af" />,
            svgString: createSvg('#9ca3af', '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>')
        },

        // === ГАСТРОНОМИЧЕСКИЕ ===
        "Кофе": {
            iconComp: <Coffee size={20} color="#854d0e" />,
            svgString: createSvg('#854d0e', '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>')
        },
        "Уличная еда": {
            iconComp: <Coffee size={20} color="#d97706" />,
            svgString: createSvg('#d97706', '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>')
        },
        "Традиционные рестораны": {
            iconComp: <Coffee size={20} color="#dc2626" />,
            svgString: createSvg('#dc2626', '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>')
        },
        "Гастрономические мастер-классы": {
            iconComp: <Star size={20} color="#eab308" />,
            svgString: createSvg('#eab308', '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>')
        },

        // === СЕМЕЙНЫЕ ===
        "Парки аттракционы и детские площадки": {
            iconComp: <Smile size={20} color="#ec4899" />,
            svgString: createSvg('#ec4899', '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>')
        },
        "Зоопарки": {
            iconComp: <Leaf size={20} color="#15803d" />,
            svgString: createSvg('#15803d', '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>')
        },
        "Музеи для детей": {
            iconComp: <Smile size={20} color="#3b82f6" />,
            svgString: createSvg('#3b82f6', '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>')
        },
        "Пикники на природе": {
            iconComp: <Sun size={20} color="#f59e0b" />,
            svgString: createSvg('#f59e0b', '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>')
        },
        "Игровые центры и развлекательные зоны": {
            iconComp: <Clapperboard size={20} color="#8b5cf6" />,
            svgString: createSvg('#8b5cf6', '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>')
        },

        // === АЛЬТЕРНАТИВНЫЕ ===
        "Заброшенные здания и территории": {
            iconComp: <Building size={20} color="#9ca3af" />,
            svgString: createSvg('#9ca3af', '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>')
        },
        "Урбанистические исследования": {
            iconComp: <Search size={20} color="#4b5563" />,
            svgString: createSvg('#4b5563', '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>')
        },
        "Тайные и мистические маршруты": {
            iconComp: <Compass size={20} color="#6366f1" />,
            svgString: createSvg('#6366f1', '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>')
        },
        "Ночные экскурсии": {
            iconComp: <Moon size={20} color="#7c3aed" />,
            svgString: createSvg('#7c3aed', '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>')
        },

        // === ТЕМАТИЧЕСКИЕ ===
        "Музыкальные маршруты": {
            iconComp: <Music size={20} color="#ec4899" />,
            svgString: createSvg('#ec4899', '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>')
        },
        "Кино и телевидение": {
            iconComp: <Clapperboard size={20} color="#ef4444" />,
            svgString: createSvg('#ef4444', '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>')
        },
        "Мифы и легенды": { // Дублирование, но для другого ключа (без "города")
            iconComp: <BookOpen size={20} color="#8b5cf6" />,
            svgString: createSvg('#8b5cf6', '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>')
        },
        "Технические и инновационные маршруты": {
            iconComp: <Monitor size={20} color="#6b7280" />,
            svgString: createSvg('#6b7280', '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>')
        },
        "Спортивные маршруты": {
            iconComp: <Bike size={20} color="#f59e0b" />,
            svgString: createSvg('#f59e0b', '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/>')
        }
    };

    return styles[subCategoryName] || defaultStyle;
};

//
// 2. ДАННЫЕ ЛОКАЛИЗАЦИИ И ГОРОДОВ
//

const LANGUAGES = [
    { code: 'ru', label: 'Русский', icon: '🇷🇺' },
    { code: 'de', label: 'Deutsch', icon: '🇩🇪' },
    { code: 'hy', label: 'Հայերեն', icon: '🇦🇲' },
    { code: 'en', label: 'English', icon: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', icon: '🇮🇳' },
];

const CITIES = [
{ id: 'kemerovo', lat: 55.3533, lon: 86.0883 },
{ id: 'moscow', lat: 55.7558, lon: 37.6173 },
{ id: 'yerevan', lat: 40.1872, lon: 44.5152 },
{ id: 'dusseldorf', lat: 51.2277, lon: 6.7735 },
{ id: 'arambol', lat: 15.6861, lon: 73.7144 },
{ id: 'pitsunda', lat: 43.165, lon: 40.335 },
{ id: 'dortmund', lat: 51.5135, lon: 7.4658 },
];

const COUNTRY_GROUPS = [
    { id: 'ru', label: 'Россия', flag: '🇷🇺', cities: [
        { id: 'kemerovo', label: 'Кемерово' },
        { id: 'moscow', label: 'Москва' },
    ]},
    { id: 'am', label: 'Армения', flag: '🇦🇲', cities: [
        { id: 'yerevan', label: 'Ереван' },
    ]},
    { id: 'de', label: 'Германия', flag: '🇩🇪', cities: [
        { id: 'dusseldorf', label: 'Дюссельдорф' },
        { id: 'dortmund', label: 'Дортмунд' },
    ]},
    { id: 'in', label: 'Индия', flag: '🇮🇳', cities: [
        { id: 'arambol', label: 'Арамболь' },
    ]},
    { id: 'ab', label: 'Абхазия', flag: '🇬🇪', cities: [
        { id: 'pitsunda', label: 'Пицунда' },
    ]},
];

const TRANSLATIONS = {
    ru: {
        app_name: "Я САМ",
        rec: "Рекомендации", cat: "Каталог", search: "Поиск", fav: "Избранное", map: "Карта",
        settings: "Настройки", city: "Выбор города", lang: "Язык", close: "Закрыть",
        completed: "Завершённые", account: "Аккаунт", contact: "Связаться", notif: "Уведомления",
        theme_light: "Светлая тема", theme_dark: "Тёмная тема", exit: "Выход",
        search_ph: "Поиск маршрутов...", nothing: "Ничего не найдено",
        steps: "шагов", dist: "км", min: "мин", audio: "Аудио", video: "Видео",
        map_btn: "Карта", about: "О месте", to_fav: "В избранное", visited: "Посещено",
        profile: "Ваш профиль", save: "Сохранить", cancel: "Отмена", change_photo: "Изменить имя",
        routes_done: "Маршрутов пройдено", rewards: "Наград получено",
        new: "Новое", ads: "Реклама", near: "Рядом с вами", empty_list: "Список пуст",
        download: "Скачать",
        audio_error: "Ошибка воспроизведения.",
        notif_permission_title: "Разрешите уведомления",
        notif_permission_text: "Мы будем уведомлять вас о:\n• Интересных маршрутах поблизости\n• Новых аудиогидах\n• Обновлениях приложения\n\nЭто поможет не пропустить ничего важного!",
        notif_allow: "Разрешить",
        notif_later: "Позже",
       city_kemerovo: "Кемерово", city_moscow: "Москва", city_yerevan: "Ереван", city_dusseldorf: "Дюссельдорф", city_arambol: "Арамболь", city_pitsunda: "Пицунда", city_dortmund: "Дортмунд",

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

        // Маршруты
        "Arambol Beach": "Пляж Арамболь", "Best beach in North Goa": "Лучший пляж северного ГОА", "Medium": "Средняя",
        "Baba Tree": "Большое баньяновое дерево и просвященный Баба", "Baba Description": "Место силы и медитации, где под огромным баньяном обитает Баба.", "High": "Высокая",
        "Arambol Rocks": "Скала Арамболь", "Rocks Description": "Лучшая локация для заката с потрясающим видом на океан.",
        "Red Square": "Красная Площадь", "Zaryadye": "Парк Зарядье", "Cascade": "Каскад", "Rheinturm": "Рейнская башня"
    },
    en: {
        app_name: "I MYSELF",
        rec: "Recommendations", cat: "Catalog", search: "Search", fav: "Favorites", map: "Map",
        settings: "Settings", city: "Select City", lang: "Language", close: "Close",
        completed: "Completed", account: "Account", contact: "Contact", notif: "Notifications",
        theme_light: "Light Theme", theme_dark: "Dark Theme", exit: "Exit",
        search_ph: "Search routes...", nothing: "Nothing found",
        steps: "steps", dist: "km", min: "min", audio: "Audio", video: "Video",
        map_btn: "Map", about: "About", to_fav: "Favorite", visited: "Visited",
        profile: "Your Profile", save: "Save", cancel: "Cancel", change_photo: "Change Photo",
        routes_done: "Routes completed", rewards: "Rewards earned",
        new: "New", near: "Near you", empty_list: "List is empty",
        download: "Download",
        audio_error: "Playback error.",
        notif_permission_title: "Enable Notifications",
        notif_permission_text: "We'll notify you about:\n• Nearby routes\n• New audio guides\n• App updates\n\nDon't miss anything important!",
        notif_allow: "Allow",
        notif_later: "Later",
    
        city_dortmund: "Dortmund", city_kemerovo: "Kemerovo", city_moscow: "Moscow", city_yerevan: "Yerevan", city_dusseldorf: "Dusseldorf", city_arambol: "Arambol", city_pitsunda: "Pitsunda",

        "Культурные и исторические маршруты": "Cultural & Historical",
        "Природные и активные маршруты": "Nature & Active",
        "Семейные маршруты": "Family Routes",
        "Альтернативные маршруты": "Alternative",
        "Гастрономические маршруты": "Gastronomic",
        "Тематические маршруты": "Thematic",
        "Современные и урбанистические маршруты": "Modern & Urban",

        "Набережная": "Embankment", "Музеи и выставки": "Museums", "Памятники и мемориалы": "Monuments",
        "Архитектурные достопримечательности": "Architecture", "Городские площади": "Squares",
        "Исторические кварталы": "Historic Quarters", "Церкви и храмы": "Churches", "Легенды и мифы города": "Myths & Legends",

        "Природные зоны и парки": "Parks", "Горные и лесные маршруты": "Forest Trails",
        "Активный отдых у воды": "Water Activities", "Спортивные площадки и фитнес-парки": "Sports & Fitness",

        "Скульптуры и уличное искусство": "Street Art", "Современная архитектура": "Modern Architecture",
        "Городские лаборатории": "Urban Labs", "Реставрации и обновления": "Restoration",

        "Кофе": "Coffee", "Уличная еда": "Street Food", "Традиционные рестораны": "Restaurants",
        "Гастрономические мастер-классы": "Master Classes",

        "Парки аттракционы и детские площадки": "Amusement Parks", "Зоопарки": "Zoos",
        "Музеи для детей": "Kids Museums", "Пикники на природе": "Picnics",
        "Игровые центры и развлекательные зоны": "Game Centers",

        "Заброшенные здания и территории": "Abandoned Places", "Урбанистические исследования": "Urban Research",
        "Тайные и мистические маршруты": "Secret & Mystic", "Ночные экскурсии": "Night Tours",

        "Музыкальные маршруты": "Musical", "Кино и телевидение": "Cinema & TV",
        "Мифы и легенды": "Myths & Legends", "Технические и инновационные маршруты": "Tech & Innovation",
        "Спортивные маршруты": "Sports Routes",

        "Arambol Beach": "Arambol Beach", "Best beach in North Goa": "The best beach in North Goa", "Medium": "Medium",
        "Baba Tree": "The Big Banyan Tree and the Enlightened Baba", "Baba Description": "A place of power and meditation where Baba lives under a huge banyan tree.", "High": "High",
        "Arambol Rocks": "Arambol Rocks", "Rocks Description": "The best location for sunset with a stunning view of the ocean.",
        "Red Square": "Red Square", "Zaryadye": "Zaryadye Park", "Cascade": "The Cascade", "Rheinturm": "Rhine Tower"
    },
    de: {
        app_name: "ICH SELBST",
        rec: "Empfehlungen", cat: "Katalog", search: "Suche", fav: "Favoriten", map: "Karte",
        settings: "Einstellungen", city: "Stadt wählen", lang: "Sprache", close: "Schließen",
        completed: "Abgeschlossen", account: "Konto", contact: "Kontakt", notif: "Benachrichtigungen",
        theme_light: "Helles Thema", theme_dark: "Dunkles Thema", exit: "Ausgang",
        search_ph: "Routen suchen...", nothing: "Nichts gefunden",
        steps: "schritte", dist: "km", min: "min", audio: "Audio", video: "Video",
        map_btn: "Karte", about: "Über", to_fav: "Favorit", visited: "Besucht",
        profile: "Ihr Profil", save: "Speichern", cancel: "Abbrechen", change_photo: "Foto ändern",
        routes_done: "Routen fertig", rewards: "Belohnungen",
        new: "Neu", near: "In der Nähe", empty_list: "Liste ist leer",
        download: "Herunterladen",
        audio_error: "Wiedergabefehler.",
        notif_permission_title: "Benachrichtigungen aktivieren",
        notif_permission_text: "Wir benachrichtigen Sie über:\n• Routen in der Nähe\n• Neue Audioguides\n• App-Updates\n\nVerpassen Sie nichts Wichtiges!",
        notif_allow: "Erlauben",
        notif_later: "Später",
        city_dortmund: "Dortmund", city_kemerovo: "Kemerowo", city_moscow: "Moskau", city_yerevan: "Eriwan", city_dusseldorf: "Düsseldorf", city_arambol: "Arambol", city_pitsunda: "Pizunda",

        "Культурные и исторические маршруты": "Kultur & Geschichte",
        "Природные и активные маршруты": "Natur & Aktiv",
        "Семейные маршруты": "Familienrouten",
        "Альтернативные маршруты": "Alternativ",
        "Гастрономические маршруты": "Gastronomie",
        "Тематические маршруты": "Thematisch",
        "Современные и урбанистические маршруты": "Modern & Urban",

        "Набережная": "Uferpromenade", "Музеи и выставки": "Museen", "Памятники и мемориалы": "Denkmäler",
        "Природные зоны и парки": "Parks", "Кофе": "Kaffee",
        "Архитектурные достопримечательности": "Architektur", "Городские площади": "Plätze",
        "Исторические кварталы": "Altstadt", "Церкви и храмы": "Kirchen", "Легенды и мифы города": "Mythen & Legenden",
        
        "Горные и лесные маршруты": "Waldwege", "Активный отдых у воды": "Wassersport", "Спортивные площадки и фитнес-парки": "Sport & Fitness",
        "Скульптуры и уличное искусство": "Straßenkunst", "Современная архитектура": "Moderne Architektur",
        "Городские лаборатории": "Stadtlabore", "Реставрации и обновления": "Restaurierung",
        "Уличная еда": "Street Food", "Традиционные рестораны": "Restaurants", "Гастрономические мастер-классы": "Meisterklassen",
        "Парки аттракционы и детские площадки": "Vergnügungsparks", "Зоопарки": "Zoos", "Музеи для детей": "Kindermuseen",
        "Пикники на природе": "Picknicks", "Игровые центры и развлекательные зоны": "Spielzentren",
        "Заброшенные здания и территории": "Verlassene Orte", "Урбанистические исследования": "Stadtforschung",
        "Тайные и мистические маршруты": "Geheimnisvoll", "Ночные экскурсии": "Nachttouren",
        "Музыкальные маршруты": "Musik", "Кино и телевидение": "Kino & TV", "Мифы и легенды": "Mythen",
        "Технические и инновационные маршруты": "Technik", "Спортивные маршруты": "Sportrouten",

        "Arambol Beach": "Arambol Strand", "Best beach in North Goa": "Der beste Strand in Nord-Goa", "Medium": "Mittel",
        "Baba Tree": "Der große Banyan-Baum", "Baba Description": "Ein Ort der Kraft und Meditation.", "High": "Hoch",
        "Arambol Rocks": "Arambol Rocks", "Rocks Description": "Der beste Ort für den Sonnenuntergang.",
        "Red Square": "Roter Platz", "Zaryadye": "Zaryadye Park", "Cascade": "Kaskade", "Rheinturm": "Rheinturm"
    },
    hy: {
        app_name: "ԵՍ ԻՆՔՍ",
        rec: "Առաջարկներ", cat: "Կատալոգ", search: "Որոնել", fav: "Ընտրյալներ", map: "Քարտեզ",
        settings: "Կարգավորումներ", city: "Ընտրել քաղաք", lang: "Լեզու", close: "Փակել",
        completed: "Ավարտված", account: "Հաշիվ", contact: "Կապ", notif: "Ծանուցումներ",
        theme_light: "Լուսավոր թեմա", theme_dark: "Մութ թեմա", exit: "Ելք",
        search_ph: "Որոնել երթուղիներ...", nothing: "Ոչինչ չի գտնվել",
        steps: "քայլ", dist: "կմ", min: "րոպե", audio: "Աուդիո", video: "Վիդեո",
        map_btn: "Քարտեզ", about: "Մասին", to_fav: "Հավանել", visited: "Այցելած",
        profile: "Ձեր էջը", save: "Պահպանել", cancel: "Չեղարկել", change_photo: "Փոխել նկարը",
        routes_done: "Անցած երթուղիներ", rewards: "Պարգևներ",
        new: "Նոր", near: "Մոտակայքում", empty_list: "Ցուցակը դատարկ է",
        download: "Ներբեռնել",
        audio_error: "Սխալ:",
        notif_permission_title: "Թույլ տվեք ծանուցումները",
        notif_permission_text: "Մենք կծանուցենք ձեզ՝\n• Մոտակա երթուղիների մասին\n• Նոր աուդիոուղեցույցների\n• Թարմացումների\n\nՄի՛ բաց թողեք կարևորը!",
        notif_allow: "Թույլատրել",
        notif_later: "Ավելի ուշ",
        city_dortmund: "Դորտմունդ", city_kemerovo: "Կեմերովո", city_moscow: "Մոսկվա", city_yerevan: "Երևան", city_dusseldorf: "Դյուսելդորֆ", city_arambol: "Արամբոլ", city_pitsunda: "Պիցունդա",

        "Культурные и исторические маршруты": "Մշակութային",
        "Природные и активные маршруты": "Բնություն",
        "Семейные маршруты": "Ընտանեկան",
        "Альтернативные маршруты": "Այլընտրանքային",
        "Гастрономические маршруты": "Գաստրոնոմիական",
        "Тематические маршруты": "Թեմատիկ",
        "Современные и урбанистические маршруты": "Ժամանակակից",

        "Набережная": "Ափամերձ", "Музеи и выставки": "Թանգարաններ", "Памятники и мемориалы": "Հուշարձաններ", "Кофе": "Սուրճ",
        "Скульптуры и уличное искусство": "Փողոցային արվեստ", "Природные зоны и парки": "Այգիներ", "Церкви и храмы": "Եկեղեցիներ",
        "Архитектурные достопримечательности": "Ճարտարապետություն", "Городские площади": "Հրապարակներ",
        "Исторические кварталы": "Պատմական թաղամասեր", "Легенды и мифы города": "Լեգենդներ",
        "Горные и лесные маршруты": "Անտառային", "Активный отдых у воды": "Ջրային հանգիստ", "Спортивные площадки и фитнес-парки": "Սպորտ",
        "Современная архитектура": "Ժամանակակից ճարտարապետություն", "Городские лаборатории": "Քաղաքային լաբորատորիաներ",
        "Реставрации и обновления": "Վերականգնում", "Уличная еда": "Փողոցային սնունդ", "Традиционные рестораны": "Ռեստորաններ",
        "Гастрономические мастер-классы": "Վարպետության դասեր", "Парки аттракционы и детские площадки": "Ատրակցիոններ",
        "Зоопарки": "Կենդանաբանական այգիներ", "Музеи для детей": "Մանկական թանգարաններ", "Пикники на природе": "Պիկնիկներ",
        "Игровые центры и развлекательные зоны": "Խաղային կենտրոններ", "Заброшенные здания и территории": "Լքված վայրեր",
        "Урбанистические исследования": "Ուրբանիստիկա", "Тайные и мистические маршруты": "Գաղտնի և միստիկ",
        "Ночные экскурсии": "Գիշերային էքսկուրսիաներ", "Музыкальные маршруты": "Երաժշտական", "Кино и телевидение": "Կինո և TV",
        "Мифы и легенды": "Առասպելներ", "Технические и инновационные маршруты": "Տեխնոլոգիաներ", "Спортивные маршруты": "Սպորտային",

        "Arambol Beach": "Արամբոլ լողափ", "Best beach in North Goa": "Հյուսիսային Գոաի լավագույն լողափը", "Medium": "Միջին",
        "Baba Tree": "Մեծ բանյան ծառը", "Baba Description": "Զորության և մեդիտացիայի վայր:", "High": "Բարձր",
        "Arambol Rocks": "Արամբոլ ժայռեր", "Rocks Description": "Լավագույն վայրը մայրամուտի համար:",
        "Red Square": "Կարմիր հրապարակ", "Zaryadye": "Զարյադիե", "Cascade": "Կասկադ", "Rheinturm": "Հռենոսի աշտարակ"
    },
    hi: {
        app_name: "मैं स्वयं",
        rec: "सिफारिशें", cat: "सूची", search: "खोजें", fav: "पसंदीदा", map: "मानचित्र",
        settings: "सेटिंग्स", city: "शहर चुनें", lang: "भाषा", close: "बंद करें",
        completed: "पूर्ण", account: "खाता", contact: "संपर्क", notif: "सूचनाएं",
        theme_light: "लाइट थीम", theme_dark: "डार्क थीम", exit: "निकास",
        search_ph: "मार्ग खोजें...", nothing: "कुछ नहीं मिला",
        steps: "कदम", dist: "किमी", min: "मिनट", audio: "ऑडियो", video: "वीडियो",
        map_btn: "मानचित्र", about: "के बारे में", to_fav: "पसंदीदा में", visited: "देखा गया",
        profile: "आपकी प्रोफाइल", save: "सहेजें", cancel: "रद्द करें", change_photo: "फोटो बदलें",
        routes_done: "मार्ग पूरे हुए", rewards: "पुरस्कार",
        new: "नया", near: "आपके पास", empty_list: "सूची खाली है",
        download: "डाउनलोड करें",
        audio_error: "ऑडियो त्रुटि।",
        notif_permission_title: "सूचनाएं सक्षम करें",
        notif_permission_text: "हम आपको सूचित करेंगे:\n• पास के मार्गों के बारे में\n• नए ऑडियो गाइड\n• ऐप अपडेट\n\nकुछ भी महत्वपूर्ण न चूकें!",
        notif_allow: "अनुमति दें",
        notif_later: "बाद में",
        city_kemerovo: "केमेरोवो", city_moscow: "मास्को", city_yerevan: "येरेवान", city_dusseldorf: "डसेलडोर्फ", city_arambol: "अरम्बोल",
        
        "Культурные и исторические маршруты": "सांस्कृतिक",
        "Природные и активные маршруты": "प्रकृति",
        "Семейные маршруты": "पारिवारिक",
        "Альтернативные маршруты": "वैकल्पिक",
        "Гастрономические маршруты": "खान-पान",
        "Тематические маршруты": "विषयगत",
        "Современные и урбанистические маршруты": "आधुनिक",

        "Набережная": "तटबंध", "Музеи и выставки": "संग्रहालय", "Памятники и мемориалы": "स्मारक", "Кофе": "कॉफ़ी",
        "Скульптуры и уличное искусство": "सड़क कला", "Природные зоны и парки": "पार्क", "Церкви и храмы": "मंदिर",
        "Архитектурные достопримечательности": "वास्तुकला", "Городские площади": "चौक", "Исторические кварталы": "ऐतिहासिक",
        "Легенды и мифы города": "मिथक", "Горные и лесные маршруты": "वन मार्ग", "Активный отдых у воды": "जल गतिविधियाँ",
        "Спортивные площадки и фитнес-парки": "खेल", "Современная архитектура": "आधुनिक वास्तुकला", "Городские лаборатории": "शहरी प्रयोगशालाएं",
        "Реставрации и обновления": "जीर्णोद्धार", "Уличная еда": "स्ट्रीट फूड", "Традиционные рестораны": "रेस्तरां",
        "Гастрономические мастер-классы": "मास्टर क्लास", "Парки аттракционы и детские площадки": "मनोरंजन पार्क",
        "Зоопарки": "चिड़ियाघर", "Музеи для детей": "बच्चों का संग्रहालय", "Пикники на природе": "पिकनिक",
        "Игровые центры и развлекательные зоны": "गेम सेंटर", "Заброшенные здания и территории": "परित्यक्त स्थान",
        "Урбанистические исследования": "शहरी अनुसंधान", "Тайные и мистические маршруты": "रहस्यमय", "Ночные экскурсии": "रात्रि भ्रमण",
        "Музыкальные маршруты": "संगीत", "Кино и телевидение": "सिनेमा", "Мифы и легенды": "मिथक और किंवदंतियां",
        "Технические и инновационные маршруты": "तकनीकी", "Спортивные маршруты": "खेल मार्ग",

        "Arambol Beach": "अरम्बोल बीच", "Best beach in North Goa": "उत्तरी गोवा का सबसे अच्छा समुद्र तट", "Medium": "मध्यम",
        "Baba Tree": "बड़ा बरगद का पेड़", "Baba Description": "शक्ति और ध्यान का स्थान।", "High": "उच्च",
        "Arambol Rocks": "अरम्बोल चट्टानें", "Rocks Description": "सूर्यास्त के लिए सबसे अच्छी जगह।",
        "Red Square": "लाल चौक", "Zaryadye": "ज़ार्याद्ये", "Cascade": "कैस्केड", "Rheinturm": "राइन टॉवर"
    }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2; const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c;
};
const isCategoryActive = (categoryData) => {
    if (!categoryData) return false;
    return Object.values(categoryData).some(subCategoryArray => Array.isArray(subCategoryArray) && subCategoryArray.length > 0);
};

const RUSTORE_LINK = "https://www.rustore.ru/catalog/app/com.yasam.app";
const VERSION_CHECK_URL = "https://raw.githubusercontent.com/artemasovvalera/y_s/main/version.json";

const CATALOG_STRUCTURE = {
    "Культурные и исторические маршруты": ["Набережная", "Музеи и выставки", "Памятники и мемориалы", "Архитектурные достопримечательности", "Городские площади", "Исторические кварталы", "Церкви и храмы", "Легенды и мифы города"],
    "Природные и активные маршруты": ["Природные зоны и парки", "Горные и лесные маршруты", "Активный отдых у воды", "Спортивные площадки и фитнес-парки"],
    "Современные и урбанистические маршруты": ["Скульптуры и уличное искусство", "Современная архитектура", "Городские лаборатории", "Реставрации и обновления"],
    "Гастрономические маршруты": ["Кофе", "Уличная еда", "Традиционные рестораны", "Гастрономические мастер-классы"],
    "Семейные маршруты": ["Парки аттракционы и детские площадки", "Зоопарки", "Музеи для детей", "Пикники на природе", "Игровые центры и развлекательные зоны"],
    "Альтернативные маршруты": ["Заброшенные здания и территории", "Урбанистические исследования", "Тайные и мистические маршруты", "Ночные экскурсии"],
    "Тематические маршруты": ["Музыкальные маршруты", "Кино и телевидение", "Мифы и легенды", "Технические и инновационные маршруты", "Спортивные маршруты"],
};

// --- ДАННЫЕ МАРШРУТОВ (ГЕНЕРАЦИЯ) ---
const getRoutesData = (cityId, lang) => {
const t = (txt) => TRANSLATIONS[lang]?.[txt] || txt;

// === УНИВЕРСАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ ВСЕХ ГОРОДОВ ===
// Мы просто заполним их внутри блоков if/else для конкретного города
let curatedRecommended = [];
let curatedExplore = [];
let curatedInteresting = [];

// 1. Создаем пустую структуру каталога (скелет)
// Это гарантирует, что все разделы всегда существуют, даже если они пустые
const getEmptyStructure = () => ({
        "Культурные и исторические маршруты": {
            "Набережная": [], "Музеи и выставки": [], "Памятники и мемориалы": [], "Архитектурные достопримечательности": [],
            "Городские площади": [], "Исторические кварталы": [], "Церкви и храмы": [], "Легенды и мифы города": []
        },
        "Природные и активные маршруты": {
            "Природные зоны и парки": [], "Горные и лесные маршруты": [], "Активный отдых у воды": [], "Спортивные площадки и фитнес-парки": []
        },
        "Современные и урбанистические маршруты": {
            "Скульптуры и уличное искусство": [], "Современная архитектура": [], "Городские лаборатории": [], "Реставрации и обновления": []
        },
        "Гастрономические маршруты": {
            "Кофе": [], "Уличная еда": [], "Традиционные рестораны": [], "Гастрономические мастер-классы": []
        },
        "Семейные маршруты": {
            "Парки аттракционы и детские площадки": [], "Зоопарки": [], "Музеи для детей": [], "Пикники на природе": [], "Игровые центры и развлекательные зоны": []
        },
        "Альтернативные маршруты": {
            "Заброшенные здания и территории": [], "Урбанистические исследования": [], "Тайные и мистические маршруты": [], "Ночные экскурсии": []
        },
        "Тематические маршруты": {
            "Музыкальные маршруты": [], "Кино и телевидение": [], "Мифы и легенды": [], "Технические и инновационные маршруты": [], "Спортивные маршруты": []
        }
    });

    const structure = getEmptyStructure();

    // 2. Наполняем структуру в зависимости от города
    if (cityId === 'kemerovo') {
        // --- ПЕРЕМЕННЫЕ КЕМЕРОВО ---
        const pushkinRoute = { name: "Площадь и Памятник Пушкину", distance: 0.5, time: "5 мин", difficulty: "Лёгкая", videoUrl: "https://rutube.ru/video/39841ce0856abb688f35f07e6d06f474/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXRGla", audioUrl: "https://archive.org/download/20251028_20251028_0740/%D0%BF%D0%BB%D0%BE%D1%89%D0%B0%D0%B4%D1%8C%20%D0%BF%D1%83%D1%88%D0%BA%D0%B8%D0%BD%D0%B0.MP3", image: "https://archive.org/download/20251028_20251028_0740/IMG_20251028_130447.jpg", location: { lat: 55.357344, lon: 86.087308 }, descriptionShort: "Уютная площадь в центре города.", subCategory: "Городские площади" };
        const minerRoute = { name: "Память шахтёрам Кузбасса", distance: 1.5, time: "20 мин", difficulty: "Лёгкая", videoUrl: "https://rutube.ru/video/a296940a183cdc08d317c54345547175/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXRS8n", audioUrl: "https://archive.org/download/miner_202510/miner.MP3", image: "https://archive.org/download/miner_202510/7933c1ff3b8662e1762c21e13a75417f.jpg", location: { lat: 55.374074, lon: 86.078468 }, descriptionShort: "Монументальный памятник шахтёрам.", subCategory: "Памятники и мемориалы" };
        const importCoffeeRoute = { name: "Import Coffee", distance: 0.1, time: "5 мин", difficulty: "Очень лёгкая", videoUrl: "", geoUrl: "https://yandex.ru/maps/-/CLSXRDmw", audioUrl: "https://archive.org/download/20251029_20251029_1604/%D0%B8%D0%BC%D0%BF%D0%BE%D1%80%D1%82%D0%BA%D0%BE%D1%84%D0%B5.MP3", image: "https://archive.org/download/20251029_20251029_1604/caska-kapucino-s-kofe-v-zernah-na-stole.jpg", location: { lat: 55.358212, lon: 86.083722 }, descriptionShort: "Вкусный кофе в районе набережной.", subCategory: "Кофе" };
        const coffeePrivalRoute = {  name: "Кофейный привал",  distance: 0.1,  time: "10 мин",  difficulty: "Лёгкая", videoUrl: "https://rutube.ru/video/7cbee9191db8eecab9033d0f237bc979/",   geoUrl: "https://yandex.ru/maps/org/kofeyny_prival/8039828444/?ll=86.085832%2C55.358612&z=16",  audioUrl: "https://archive.org/download/2_20260127_20260127_0510/2.MP3", image: "https://archive.org/download/koffe2/koffe2.png", location: { lat: 55.358612, lon: 86.085832 },  descriptionShort: "Самая вкусная и атмосферная кофейня в районе набережной.", subCategory: "Кофе"  };
        const fiveFacts = { name: "5 фактов о Кемерово, о которых ты не знал",  distance: 0.5,  time: "10 мин",  difficulty: "Лёгкая",  geoUrl: "https://yandex.ru/maps/-/CLSXRGla", audioUrl: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/5fakt(1).MP3", videoUrl: "https://rutube.ru/video/52b6f916e4e102125400908a2a16c876/", image: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/5fakt.png", location: { lat: 55.354692, lon: 86.088503 }, descriptionShort: "Удивительные факты о городе, которые знают только местные.", subCategory: "Легенды и мифы города", isExploreRoute: true };
        const leninMemorialRoute = { name: "Памятник Ленину", distance: 1.2, time: "15 мин", difficulty: "Лёгкая", videoUrl: "https://rutube.ru/video/b617deb9362e1df28c969ae16db82226/", geoUrl: "https://yandex.ru/maps/-/CLSXRL1p", audioUrl: "https://archive.org/download/lenin_202511/Lenin.MP3", image: "https://archive.org/download/lenin_202511/Lenin.jpg", location: { lat: 55.354692, lon: 86.088503 }, descriptionShort: "Центральный памятник города.", subCategory: "Городские площади" };
        const oldestHouseRoute = { name: "Самый старый дом", distance: 0.8, time: "10 мин", difficulty: "Лёгкая", videoUrl: "https://rutube.ru/video/207c76befeba4aa49f13a0e052c3f21b/", geoUrl: "https://yandex.ru/maps/-/CLSXRXKJ", audioUrl: "https://archive.org/download/dom_20251106/dom.MP3", image: "https://archive.org/download/dom_20251106/Tx_Iuw-HnAzmgKSZsGgXEatwymlG86OJTzNFN1Wma3lQbj7sC8aecRqAmKUOdp6uKgumyxwbfGu2GN26ptLJ71oH.jpg", location: { lat: 55.359329, lon: 86.078126 }, descriptionShort: "Историческое здание, свидетель начала города.", subCategory: "Архитектурные достопримечательности" };
        const sovKirCrossroadRoute = { name: "Перекресток Советского и Кирова", distance: 0.5, time: "5 мин", difficulty: "Лёгкая", geoUrl: "https://yandex.ru/maps/-/CLSXVEOT", videoUrl: "https://rutube.ru/video/749d390303bbd9a5e1478d8da8e1bcd3/", audioUrl: "https://archive.org/download/sov-kir/sov-kir.MP3", image: "https://archive.org/download/sov-kir/ansambl-sovetskogo-2.jpg", location: { lat: 55.357470, lon: 86.075106 }, descriptionShort: "Архитектурный ансамбль.", subCategory: "Исторические кварталы", explicitDate: "2025-11-09" };
        const rampa = { name: "Памятник Лобсангу Рампе", distance: 0.5, time: "8 мин", difficulty: "Лёгкая", geoUrl: "https://yandex.ru/maps/-/CLWX7To5", videoUrl: "https://rutube.ru/video/58164fadc62c4f846920835b059e6b36/?r=wd", audioUrl: "https://archive.org/download/rampa_202511/rampa.MP3", image: "https://archive.org/download/rampa_202511/rampa.jpg", location: { lat: 55.357076, lon: 86.092200 }, descriptionShort: "Мистический памятник писателю.", subCategory: "Тайные и мистические маршруты", explicitDate: "2025-11-26" };
        const kuzbassMuseum = { name: "Кузбасский краеведческий музей", distance: 1.0, time: "12 мин", difficulty: "Лёгкая", geoUrl: "https://yandex.ru/maps/-/CLSXVMls", audioUrl: "https://archive.org/download/kuzbass-museum-2025/kuzbass_museum_audio.mp3", videoUrl: "https://rutube.ru/video/e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0/", image: "https://archive.org/download/kuzbass-museum-2025/kuzbass_museum_facade.jpg", location: { lat: 55.356116, lon: 86.080279 }, descriptionShort: "Главный краеведческий музей Кузбасса с богатой коллекцией.", subCategory: "Музеи и выставки" };
        const krasnayaGorkaMuseum1 = { name: "Музей-заповедник 'Красная Горка'", distance: 2.5, time: "30 мин", difficulty: "Средняя", geoUrl: "https://yandex.ru/maps/-/CLSXVBLq", audioUrl: "https://archive.org/download/krasnaya-gorka-2025/krasnaya_gorka_audio.mp3", videoUrl: "https://rutube.ru/video/f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1/", image: "https://archive.org/download/krasnaya-gorka-2025/krasnaya_gorka_panorama.jpg", location: { lat: 55.375438, lon: 86.071903 }, descriptionShort: "Уникальный музей под открытым небом на месте бывшей шахты.", subCategory: "Музеи и выставки" };
        const artMuseum = { name: "Музей ИЗО Кузбасса", distance: 1.1, time: "14 мин", difficulty: "Лёгкая", geoUrl: "https://yandex.ru/maps/-/CLSXVR4~", audioUrl: null, image: "https://images.unsplash.com/photo-1579541629828-5645a8f4c522?auto=format&fit=crop&w=1200&q=80", location: { lat: 55.356313, lon: 86.083243 }, descriptionShort: "Коллекции русского и зарубежного искусства.", subCategory: "Музеи и выставки" };
        const artCenter = { name: "Кузбасский центр искусств", distance: 1.3, time: "16 мин", difficulty: "Лёгкая", geoUrl: "https://yandex.ru/maps/-/CLSXVZ~V", audioUrl: null, image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80", location: { lat: 55.350957, lon: 86.075196 }, descriptionShort: "Современное арт-пространство.", subCategory: "Музеи и выставки" };
        const bezdomniipec = { name: "Бездомный Пес", distance: 0.3, time: "4 мин", difficulty: "Лёгкая", image: "https://archive.org/download/5fakt-1/bezdpe.jpg", audioUrl: "https://archive.org/download/00vvedenie-naberejnaya/%D0%B1%D0%B5%D0%B7%D0%B4%D0%BE%D0%BC%D0%BD%D1%8B%D0%B8%CC%86%20%D0%BF%D0%B5%D1%81.MP3", videoUrl: "https://rutube.ru/video/c9a406806ff214ecdc0b11f08874b32e/", location: { lat: 55.359703, lon: 86.086954 }, geoUrl: "https://yandex.ru/maps/-/CLSXVOj8", descriptionShort: "Трогательный памятник доброте.", subCategory: "Скульптуры и уличное искусство", explicitDate: "2025-11-21" };
        const mod = { name: "Модница", distance: 0.3, time: "3 мин", difficulty: "Лёгкая", image: "https://archive.org/download/modnica/XXXL.jpeg", audioUrl: "https://archive.org/download/modnica/modnica.MP3", location: { lat: 55.334873, lon: 86.174779 }, geoUrl: "https://yandex.ru/maps/-/CLgFuH67", descriptionShort: "Памятник девочке в маминых туфлях.", subCategory: "Скульптуры и уличное искусство", videoUrl: "https://rutube.ru/video/private/5106ecfe76e6c4d597832abed7e0887a/?p=np-frlzREk_KtGIxq4UfKg", explicitDate: "2025-12-05" };
        const olenLesnaya = { name: "Скульптура Олень", distance: 12.0, time: "25 мин (авто)", difficulty: "Лёгкая", image: "https://archive.org/download/orig_20251118/orig.jpeg", audioUrl: "https://archive.org/download/orig_20251118/olen.MP3", location: { lat: 55.416023, lon: 86.238736 }, geoUrl: "https://yandex.ru/maps/-/CLSXV8ov", videoUrl: "https://rutube.ru/video/4c0fb0036f5480277844c2c598f9d30d/", descriptionShort: "Скульптура в районе Лесная Поляна.", subCategory: "Природные зоны и парки", explicitDate: "2025-11-22" };
        const chas_usp = { name: "Часовня иконы Божией Матери", distance: 0.5, time: "6 мин", difficulty: "Лёгкая", image: "https://archive.org/download/dsc-1432_202511/DSC_1432.JPG", audioUrl: "https://archive.org/download/dsc-1432_202511/chas_usp.MP3", geoUrl: "https://yandex.ru/maps/-/CLSXVLlU", location: { lat: 55.353792, lon: 86.092382 }, descriptionShort: "Часовня Всех Скорбящих Радость.", subCategory: "Церкви и храмы", explicitDate: "2025-11-23", videoUrl: "https://rutube.ru/video/a667d8bccefbf54646a11b53166558cf/?r=wd" };
        const park_pobedi = { name: "Парк Победы имени Георгия Константиновича Жукова", distance: 1.5, time: "30 мин", difficulty: "сложная", image: "https://archive.org/download/20260210_20260210_1146/001.jpg", audioUrl: "https://archive.org/download/20260210_20260210_1146/%D0%BF%D0%B0%D1%80%D0%BA_%D0%BF%D0%BE%D0%B1%D0%B5%D0%B4%D1%8B.MP3", geoUrl: "https://yandex.ru/maps/-/CPQZBJ4~", location: { lat: 55.348852, lon: 86.094377 }, descriptionShort: "Парк с военной техникой", subCategory: "Парки", explicitDate: "2026-02-10", videoUrl: " https://rutube.ru/video/0d0a0b9576446540595107193164ab5e/" };
        const pcoff = { name: "Лучшее Кафе - Парадная", distance: 0.5, time: "10 мин", difficulty: "Лёгкая", image: "https://archive.org/download/cp_20260211/1100.jpg", audioUrl: "https://archive.org/download/cp_20260211/cp.MP3", geoUrl: "https://yandex.ru/maps/-/CPQ7q4M0", location: { lat: 55.358599, lon: 86.085642 }, descriptionShort: "Лучший кофе в районе набережной", subCategory: "Кофе", explicitDate: "2026-02-11", videoUrl: "https://rutube.ru/video/e246f605cbaaf51506c051839f9e2461/" };
        const s_bor = { name: "Сосновый Бор", distance: 5.5, time: "60 мин", difficulty: "Сложная", image: "https://archive.org/download/sb_20260220/sb.jpg", audioUrl: "https://archive.org/download/sb_20260220/sb.MP3", geoUrl: "https://yandex.com/maps/-/CPanVZ31", location: { lat: 55.378308, lon: 86.104392 }, descriptionShort: "Самый большой в мире хвойный городской парк!", subCategory: "Парки", explicitDate: "2026-02-19", videoUrl: "" };
        const mmuz = { name: "МиТОК — стройка, которую все видели, но никто не знает", distance: 0.5, time: "10 мин", difficulty: "Лёгкая", image: "https://archive.org/download/m1_20260226/m1.png", audioUrl: "https://archive.org/download/m1_20260226/1.MP3", geoUrl: "https://yandex.com/maps/-/CPeSrGpJ", location: { lat: 55.351509, lon: 86.100853 }, descriptionShort: "Мировой рекорд прямо в центре Кемерова", subCategory: "Музей", explicitDate: "2026-02-27", videoUrl: "https://rutube.ru/video/cf7e0d0c483280763d4ec451fb241f0a/" };
        const eli = { name: "Елыкаево-Кузбасс факты о которых вы не знали!", distance: 25, time: "120 мин", difficulty: "Сложная", image: "https://archive.org/download/elikaevo/1.png", audioUrl: "https://archive.org/download/elikaevo/elikaevo.MP3", geoUrl: "https://yandex.com/maps/-/CPukRCiz", location: { lat: 55.301100, lon: 86.257060 }, descriptionShort: "Село 1800 года!", subCategory: "Музей", explicitDate: "2026-03-08", videoUrl: "https://rutube.ru/video/a7ada5bb55d661862fb1c7fe66c04f97/" };
        const svist = { name: "Святой источник преподобного Серафима Саровского ", distance: 5, time: "60 мин", difficulty: "Сложная", image: "https://archive.org/download/sv_istochnik/23454.jpeg", audioUrl: "https://archive.org/download/sv_istochnik/sv_istochnik.MP3", geoUrl: "https://yandex.com/maps/-/CPf75Vkt", location: { lat: 55.379137, lon: 86.088940 }, descriptionShort: "Святой источник преподобного Серафима Саровского в Сосновом бору Кемерова", subCategory: "", explicitDate: "2026-04-06", videoUrl: "https://rutube.ru/video/e33695b51bb32d21c4a255ce7d90917b/?r=wd" };
        const filar = { name: "Государственная филармония Кузбасса", distance: 1, time: "10 мин", difficulty: "Лёгкая", image: "https://archive.org/download/filarmony/Filharmonio_en_Kemerovo.jpg", audioUrl: "https://archive.org/download/filarmony/filarmony.MP3", geoUrl: "https://yandex.ru/maps/-/CPCru4o4", location: { lat: 55.353329, lon: 86.094416 }, descriptionShort: "Государственная филармония Кузбасса имени Бориса Штоколова", subCategory: "", explicitDate: "2026-04-20", videoUrl: "https://rutube.ru/video/98c3e4106ce74ac28f12149488d20d99/" };
        const pristan = { name: "Пристань-могила", distance: 1, time: "20 мин", difficulty: "Лёгкая", image: "https://archive.org/download/pristan_202604/scale_1200.jpg", audioUrl: "https://archive.org/download/pristan_202604/pristan.MP3", geoUrl: "https://yandex.com/maps/-/CPCHiTPb", location: { lat: 55.376020, lon: 86.063089 }, descriptionShort: "Красная горка. Гора горелая", subCategory: "", explicitDate: "2026-04-22", videoUrl: "https://rutube.ru/video/fc544587c4c09346afaf9c25543557b1/" };
        const reki = {  name: "Малые реки Кемерово — те, о которых никто не знает", distance: 15, time: "1 ч",  difficulty: "Средняя",  image: "https://archive.org/download/reki_20260516/reki.jpg",  audioUrl: "https://archive.org/download/reki_20260516/reki.MP3", geoUrl: "https://maps.app.goo.gl/fW2CjGaV2zUy9d8C9",  location: { lat: 55.348154, lon: 86.094916 },   descriptionShort: "Евсеевка, Алыкаевка, Камышная — история рек под улицами города.",  subCategory: "история",  explicitDate: "2026-05-16", videoUrl: "https://rutube.ru/video/private/8f695da140aac3c353ae3822c9d1a7d3/?p=eFydx2K6gNOlnbhvrKPhSA" };
        // Маршруты Набережной
        const nabIntro = { name: "Введение в Набережную", distance: 0.1, time: "2 мин", difficulty: "Лёгкая", image: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/%D0%BD%D0%B0%D0%B1%D0%B5%D1%80%D0%B5%D0%B6%D0%BD%D0%B0%D1%8F.jpg", audioUrl: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/vvednaber.MP3", location: { lat: 55.365094, lon: 86.076369 }, videoUrl: "https://rutube.ru/video/340092f174a1c1614460c1d503f66ce0/", geoUrl: "https://yandex.ru/maps/-/CLSXZEJU", descriptionShort: "Начало прогулки по набережной.", subCategory: "Набережная" };
        const nabteremok = { name: "Теремок", distance: 0.1, time: "2 мин", difficulty: "Лёгкая", image: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/terem.jpg", audioUrl: "", location: { lat: 55.365094, lon: 86.076369 }, videoUrl: "https://rutube.ru/video/private/153d44b2c761310c5c55d9ae58f9e36e/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZEJU", descriptionShort: "Великолепное чугунное литье - фонари по набережной.", subCategory: "Набережная" };
        const nabfonar = { name: "Фонарные столбы набережной", distance: 0.1, time: "2 мин", difficulty: "Лёгкая", image: "https://archive.org/download/20260107_20260107_0715/fonari.JPG", audioUrl: "https://archive.org/download/00vvedenie-naberejnaya/fonary.MP3", location: { lat: 55.365094, lon: 86.076369 }, videoUrl: "https://rutube.ru/video/private/153d44b2c761310c5c55d9ae58f9e36e/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZEJU", descriptionShort: "Великолепное чугунное литье - фонари по набережной.", subCategory: "Набережная" };
        const nabBridges = { name: "Два моста", distance: 0.5, time: "5 мин", difficulty: "Лёгкая", image: "https://raw.githubusercontent.com/artemasovvalera/yasamkem/main/2mos.jpg", audioUrl: "https://dn710206.ca.archive.org/0/items/00vvedenie-naberejnaya/00vvedenie_naberejnaya.MP3", location: { lat: 55.365094, lon: 86.076369 }, videoUrl: "https://rutube.ru/video/c0f701e82cfc8590fb98fb0af0e09af2/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZEJU", descriptionShort: "Два моста в начале набережной. Прошлое и будущее рядом.", subCategory: "Набережная" };
        const nabFences = { name: "Ограды набережной", distance: 0.2, time: "8 мин", difficulty: "Лёгкая", image: "https://archive.org/download/5fakt-1/ogr.jpg", audioUrl: "https://archive.org/download/ograjdenie_end/ograjdenie_end.MP3", location: { lat: 55.364308, lon: 86.077555 }, videoUrl: "https://rutube.ru/video/54e7ffe5157d385aca13656c8cf2e0f9/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZY0U", descriptionShort: "Уникальные чугунные ограждения.", subCategory: "Набережная" };
        const nabCinema = { name: "Здание старого кинотеатра", distance: 0.5, time: "6 мин", difficulty: "Лёгкая", image: "https://archive.org/download/5fakt-1/kino.jpg", audioUrl: "https://archive.org/download/00vvedenie-naberejnaya/antik.MP3", location: { lat: 55.362439, lon: 86.080820 }, videoUrl: "https://rutube.ru/video/private/8c329af55ade6c069b45d1fdd9f83892/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZO5T", descriptionShort: "Один из старейших кинотеатров города.", subCategory: "Набережная" };
        const nabHeart = { name: "Арт-обьект Я Люблю Кемерово", distance: 0.2, time: "4 мин", difficulty: "Лёгкая", image: "https://archive.org/download/20251107_20251107_1108/%D1%8F%20%D0%BB%D1%8E%D0%B1%D0%BB%D1%8E%20%D0%BA%D0%B5%D0%BC%D0%B5%D1%80%D0%BE%D0%B2%D0%BE.png", audioUrl: "https://archive.org/download/ograjdenie_end/%D1%81%D0%B5%D1%80%D0%B4%D1%86%D0%B5.MP3", location: { lat: 55.359595, lon: 86.087298 }, videoUrl: "https://rutube.ru/video/a38198ad8df1e004b93c0e56940f331c/?r=wd", geoUrl: "https://yandex.ru/maps/-/CLSXZXIO", descriptionShort: "Популярный арт-объект.", subCategory: "Набережная" };
        const kubizm = { name: "Кубизм", distance: 0.1, time:  "2 мин", difficulty: "Лёгкая", image: "https://archive.org/download/e2_20260602/e2.jpg", audioUrl: "https://archive.org/download/e2_20260602/e2.MP3", location: { lat: 55.301142, lon: 86.257031 }, videoUrl: "https://rutube.ru/video/379b28eb6d97e276c41ccc3bbf8c7f9e/", geoUrl: "https://www.openstreetmap.org/#map=19/55.301142/86.257031", descriptionShort: "Маршрут, который открывает удивительное: как большое искусство живёт среди обычных дворов и огородов — органично, без пафоса, как будто так и было задумано.", subCategory: "Искусство" };
        const nabOgrazhdenie = { name: "Секреты ограждения набережной", distance: 1, time: "1 мин", difficulty: "Лёгкая", image: "https://archive.org/download/2026-06-05-18.23.12/%D0%A1%D0%BD%D0%B8%D0%BC%D0%BE%D0%BA%20%D1%8D%D0%BA%D1%80%D0%B0%D0%BD%D0%B0%202026-06-05%20%D0%B2%2018.23.12.png", audioUrl: "https://archive.org/download/2026-06-05-18.23.12/nab00.MP3", location: { lat: 55.365018, lon: 86.076736 }, videoUrl: "https://rutube.ru/video/f2d9174628a7edc0e84b5611c0a76870/", geoUrl: "https://yandex.ru/maps/-/CPXD5DYm", descriptionShort: "Интересная легенда, спрятанная советскими инженерами в ограждении набережной Кемерово.", subCategory: "Набережная" };
        const strahRoute = { name: "Дом Страха",distance: 0.1, time: "60 минут",  difficulty: "Средняя",  videoUrl: "https://rutube.ru/video/private/2ad7a0b5a604fd90a09a6291b0ed67ec/?p=CE1CiaTYZknU7PDxQ_yDRw", geoUrl: "https://yandex.ru/maps/-/CTCdJE9q", audioUrl: "https://archive.org/download/strah_202608/strah.MP3",  image: "https://archive.org/download/strah_202608/strah.png", location: { lat: 55.362439, lon: 86.080820 }, descriptionShort: "Три локации ужаса в сердце Парка Чудес.", subCategory: "Набережная"};

// === НАПОЛНЕНИЕ РАЗДЕЛОВ ДЛЯ КЕМЕРОВО ===
// Просто перечисляем переменные маршрутов через запятую!
curatedRecommended = [pcoff];
curatedExplore = [s_bor, mmuz, svist];
curatedInteresting = [nabOgrazhdenie, reki, rampa];


        // --- ЗАПОЛНЕНИЕ КАТАЛОГА КЕМЕРОВО ---
        structure["Культурные и исторические маршруты"]["Набережная"] = [strahRoute, nabOgrazhdenie, rampa, bezdomniipec, nabIntro, reki, nabBridges, nabfonar, nabteremok, nabFences, nabCinema, nabHeart];
        structure["Культурные и исторические маршруты"]["Музеи и выставки"] = [filar, mmuz, kuzbassMuseum, artMuseum, artCenter, kubizm];
        structure["Культурные и исторические маршруты"]["Памятники и мемориалы"] = [rampa, pushkinRoute, minerRoute, leninMemorialRoute, chas_usp, park_pobedi];
        structure["Культурные и исторические маршруты"]["Архитектурные достопримечательности"] = [filar, mmuz, mod, chas_usp, minerRoute, nabOgrazhdenie, pushkinRoute, leninMemorialRoute, oldestHouseRoute, olenLesnaya, kubizm];
        structure["Культурные и исторические маршруты"]["Городские площади"] = [pushkinRoute, minerRoute, leninMemorialRoute, park_pobedi];
        structure["Культурные и исторические маршруты"]["Исторические кварталы"] = [sovKirCrossroadRoute];
        structure["Культурные и исторические маршруты"]["Церкви и храмы"] = [chas_usp, svist];
        structure["Культурные и исторические маршруты"]["Легенды и мифы города"] = [reki, rampa, pristan, olenLesnaya, kubizm, nabOgrazhdenie, strahRoute];
        
        structure["Природные и активные маршруты"]["Природные зоны и парки"] = [reki, s_bor, mod, svist, olenLesnaya, park_pobedi, eli];
        structure["Природные и активные маршруты"]["Горные и лесные маршруты"] = [svist, s_bor, eli];
         structure["Природные и активные маршруты"]["Спортивные площадки и фитнес-парки"] = [s_bor];
        
        structure["Современные и урбанистические маршруты"]["Скульптуры и уличное искусство"] = [mod, minerRoute, pushkinRoute, leninMemorialRoute, bezdomniipec, olenLesnaya, kubizm];
        structure["Современные и урбанистические маршруты"]["Современная архитектура"] = [mmuz, mod, bezdomniipec, kubizm];
        structure["Современные и урбанистические маршруты"]["Реставрации и обновления"] = [oldestHouseRoute, sovKirCrossroadRoute, kubizm];
        
        structure["Гастрономические маршруты"]["Кофе"] = [pcoff, importCoffeeRoute, coffeePrivalRoute];
        
        structure["Семейные маршруты"]["Парки аттракционы и детские площадки"] = [strahRoute, s_bor, olenLesnaya, park_pobedi];
        structure["Семейные маршруты"]["Игровые центры и развлекательные зоны"] = [strahRoute, olenLesnaya];
        structure["Семейные маршруты"]["Пикники на природе"] = [s_bor, eli];
        
        structure["Альтернативные маршруты"]["Урбанистические исследования"] = [reki, mmuz, s_bor, chas_usp, olenLesnaya, oldestHouseRoute, sovKirCrossroadRoute, kubizm];
        structure["Альтернативные маршруты"]["Тайные и мистические маршруты"] = [pristan, rampa, strahRoute];
        
        structure["Тематические маршруты"]["Мифы и легенды"] = [rampa, pristan, olenLesnaya, nabOgrazhdenie];
        structure["Тематические маршруты"]["Спортивные маршруты"] = [s_bor];
        structure["Тематические маршруты"]["Музыкальные маршруты"] = [filar];
        
        structure["Культурные и исторические маршруты"]["Легенды и мифы города"].push(fiveFacts);

    } else if (cityId === 'arambol') {
        // --- ПЕРЕМЕННЫЕ АРАМБОЛЯ ---
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

// === НАПОЛНЕНИЕ РАЗДЕЛОВ ДЛЯ АРАМБОЛЯ ===
curatedRecommended = [arambolBeach]; // ← Замени на свои переменные
curatedExplore = [baba, rocks];                 // ← Замени на свои переменные
curatedInteresting = [baba];               // ← Замени на свои переменные

    } else if (cityId === 'moscow') {
        const redSquare = { name: t("Red Square"), distance: 0.5, time: "10 min", image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1200", location: { lat: 55.7539, lon: 37.6208 }, descriptionShort: "Heart of Moscow.", subCategory: "Памятники и мемориалы" };
        const zaryadye = { name: t("Zaryadye"), distance: 0.8, time: "15 min", image: "https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=1200", location: { lat: 55.7511, lon: 37.6287 }, descriptionShort: "Modern park.", subCategory: "Природные зоны и парки" };
        
        structure["Культурные и исторические маршруты"]["Памятники и мемориалы"] = [redSquare];
        structure["Природные и активные маршруты"]["Природные зоны и парки"] = [zaryadye];

// === НАПОЛНЕНИЕ РАЗДЕЛОВ ДЛЯ МОСКВЫ ===
curatedRecommended = [redSquare, zaryadye]; // ← Замени на свои переменные
curatedExplore = [zaryadye];        // ← Замени на свои переменные
curatedInteresting = [zaryadye]; // ← Замени на свои переменные

       } else if (cityId === 'yerevan') {
        const cascadeRoute = { name: "Каскад — самостоятельная прогулка с аудиогидом", distance: 1.2, time: "40 мин", difficulty: "Средняя", image: "https://archive.org/download/kaskad/photo_2026-05-21_01-55-03%20%282%29.jpg", audioUrl: "https://archive.org/download/kaskad/kaskad.MP3", videoUrl: "https://rutube.ru/video/3e9045ab4ca1d7ace838324c173e2b98/", geoUrl: "https://yandex.ru/maps/-/CCUiaMXrtB", location: { lat: 40.1919, lon: 44.5153 }, descriptionShort: "Каскад — монументальная лестница из белого туфа с фонтанами, скульптурами и смотровыми площадками. Внутри — Центр искусств Гафесчяна с коллекцией современного искусства. С вершины открывается панорама Еревана и вид на Арарат.", subCategory: "Архитектурные достопримечательности" };
        const erevFountains = { name: "Питьевые фонтанчики", distance: 0.1, time: "5 мин", difficulty: "Лёгкая", image: "https://archive.org/download/er_pu/1212111.png", audioUrl: "https://archive.org/download/er_pu/er_pu.MP3", location: { lat: 40.16119950780383, lon: 44.51159737974957 }, videoUrl: "https://youtu.be/P9JKqs3vl7o", geoUrl: "https://maps.app.goo.gl/pCFG6dqXqrH1xNF9A", descriptionShort: "Питьевые фонтанчики Еревана — маленькая традиция большого города.", subCategory: "Ереван" };
        const erevFountainRepublic = { name: "Поющий фонтан на площади Республики", distance: 1, time: "30 мин", difficulty: "Лёгкая", image: "https://archive.org/download/epf77ipp8usk3kgcsk2ffrivutwqqmkd/epf77ipp8usk3kgcsk2ffrivutwqqmkd.webp", audioUrl: "https://archive.org/download/fontan_202606/fontan.MP3", location: { lat: 40.17824217635196, lon: 44.513464698100464 }, videoUrl: "https://archive.org/download/epf77ipp8usk3kgcsk2ffrivutwqqmkd/202606041245%20%281%29.mp4", geoUrl: "https://maps.app.goo.gl/V8dHVqcMNByFWQnx7", descriptionShort: "Поющие фонтаны на площади Республики. Рекомендуется к посещению вечером.", subCategory: "Ереван" };
        const erebuniFortress = { name: "Крепость Эребуни", distance: 1, time: "60 мин", difficulty: "Лёгкая", image: "https://archive.org/download/202606041245-1-2/Erebuni_Fortress_21.jpg", audioUrl: "https://archive.org/download/202606041245-1-2/202606041245-_1_.mp3", location: { lat: 40.1406, lon: 44.5381 }, videoUrl: "https://archive.org/download/202606041245-1-2/202606041245%20%281%29%20%282%29.mp4", geoUrl: "https://maps.app.goo.gl/F4aR2Vk22L5HpP9n6", descriptionShort: "Урартская крепость 782 года до н.э. — именно отсюда пошло название Ереван. Основана царём Аргишти I и служила форпостом в Араратской долине.", subCategory: "Ереван" };
        const khorVirap = {  name: "Хор Вирап — древний монастырь с видом на Арарат",  distance: 40,   time: "40 мин",   difficulty: "Средняя",   image: "https://archive.org/download/202607011908/%D0%A1%D0%BD%D0%B8%D0%BC%D0%BE%D0%BA%20%D1%8D%D0%BA%D1%80%D0%B0%D0%BD%D0%B0%202026-07-02%20%D0%B2%2017.11.36.png",   audioUrl: "https://archive.org/download/202607011908/202607011908.mp3",   videoUrl: "https://youtu.be/IDGqDOTTmo4",   geoUrl: "https://maps.app.goo.gl/kXHjT9GScBkZ165Y9",   location: { lat: 39.8782917, lon: 44.5764714 },   descriptionShort: "Древний монастырь в 40 км к югу от Еревана у границы с Турцией. Стоит на холме у горы Арарат с лучшим видом на святыню. Название переводится как «глубокая темница». Поездка занимает около 40 минут.",   subCategory: "Церкви и храмы",  explicitDate: "2026-07-02"};

// === КУРИРУЕМЫЕ РАЗДЕЛЫ ДЛЯ ЕРЕВАНА ===
// Просто добавляй сюда имена переменных маршрутов через запятую
curatedRecommended = [khorVirap, erevFountains];
curatedExplore = [erevFountainRepublic, erebuniFortress];
curatedInteresting = [cascadeRoute];



        // === Культурные и исторические маршруты ===
        structure["Культурные и исторические маршруты"]["Набережная"] = [erebuniFortress, erevFountains, cascadeRoute];
        structure["Культурные и исторические маршруты"]["Музеи и выставки"] = [erevFountains, cascadeRoute];
        structure["Культурные и исторические маршруты"]["Памятники и мемориалы"] = [erevFountains, cascadeRoute];
        structure["Культурные и исторические маршруты"]["Архитектурные достопримечательности"] = [erebuniFortress, erevFountains, erevFountainRepublic, cascadeRoute];
        structure["Культурные и исторические маршруты"]["Городские площади"] = [cascadeRoute];
        structure["Культурные и исторические маршруты"]["Исторические кварталы"] = [cascadeRoute];
        structure["Культурные и исторические маршруты"]["Церкви и храмы"] = [khorVirap, cascadeRoute];
        structure["Культурные и исторические маршруты"]["Легенды и мифы города"] = [khorVirap, erevFountains, cascadeRoute];

        // === Природные и активные маршруты ===
        structure["Природные и активные маршруты"]["Природные зоны и парки"] = [khorVirap, erebuniFortress, cascadeRoute];
        structure["Природные и активные маршруты"]["Горные и лесные маршруты"] = [cascadeRoute];
        structure["Природные и активные маршруты"]["Активный отдых у воды"] = [cascadeRoute];
        structure["Природные и активные маршруты"]["Спортивные площадки и фитнес-парки"] = [cascadeRoute];

        // === Современные и урбанистические маршруты ===
        structure["Современные и урбанистические маршруты"]["Скульптуры и уличное искусство"] = [erevFountains, erevFountainRepublic, cascadeRoute];
        structure["Современные и урбанистические маршруты"]["Современная архитектура"] = [cascadeRoute];
        structure["Современные и урбанистические маршруты"]["Городские лаборатории"] = [cascadeRoute];
        structure["Современные и урбанистические маршруты"]["Реставрации и обновления"] = [cascadeRoute];

        // === Гастрономические маршруты ===
        structure["Гастрономические маршруты"]["Кофе"] = [cascadeRoute];
        structure["Гастрономические маршруты"]["Уличная еда"] = [cascadeRoute];
        structure["Гастрономические маршруты"]["Традиционные рестораны"] = [cascadeRoute];
        structure["Гастрономические маршруты"]["Гастрономические мастер-классы"] = [cascadeRoute];

        // === Семейные маршруты ===
        structure["Семейные маршруты"]["Парки аттракционы и детские площадки"] = [cascadeRoute];
        structure["Семейные маршруты"]["Зоопарки"] = [cascadeRoute];
        structure["Семейные маршруты"]["Музеи для детей"] = [cascadeRoute];
        structure["Семейные маршруты"]["Пикники на природе"] = [cascadeRoute];
        structure["Семейные маршруты"]["Игровые центры и развлекательные зоны"] = [cascadeRoute];

        // === Альтернативные маршруты ===
        structure["Альтернативные маршруты"]["Заброшенные здания и территории"] = [erebuniFortress, cascadeRoute];
        structure["Альтернативные маршруты"]["Урбанистические исследования"] = [cascadeRoute];
        structure["Альтернативные маршруты"]["Тайные и мистические маршруты"] = [cascadeRoute];
        structure["Альтернативные маршруты"]["Ночные экскурсии"] = [cascadeRoute];

        // === Тематические маршруты ===
        structure["Тематические маршруты"]["Музыкальные маршруты"] = [erevFountainRepublic, cascadeRoute];
        structure["Тематические маршруты"]["Кино и телевидение"] = [cascadeRoute];
        structure["Тематические маршруты"]["Мифы и легенды"] = [khorVirap, erevFountains, cascadeRoute];
        structure["Тематические маршруты"]["Технические и инновационные маршруты"] = [erevFountainRepublic, cascadeRoute];
        structure["Тематические маршруты"]["Спортивные маршруты"] = [cascadeRoute];
     
        
   } else if (cityId === 'dusseldorf') {
const tower = { name: t("Rheinturm"), distance: 0.2, time: "10 min", image: "https://images.unsplash.com/photo-1555818671-55b35242735a?w=1200", location: { lat: 51.2179, lon: 6.7617 }, descriptionShort: "Telecommunications tower.", subCategory: "Архитектурные достопримечательности" };
structure["Культурные и исторические маршруты"]["Архитектурные достопримечательности"] = [tower];
// === НАПОЛНЕНИЕ РАЗДЕЛОВ ДЛЯ ДЮССЕЛЬДОРФА ===
curatedRecommended = [tower];
curatedExplore = [tower];
curatedInteresting = [tower];
} else if (cityId === 'dortmund') {
    // --- ПЕРЕМЕННЫЕ ДОРТМУНДА ---
    const dortmundFacts = {  name: "Факты о Дортмунде",    distance: 0.5,         time: "10 мин",         difficulty: "Лёгкая",         videoUrl: "https://youtu.be/hyQI-2bwVcc",         geoUrl: "https://maps.app.goo.gl/2JbtHoMVemLTwKjm7",         audioUrl: "https://archive.org/download/dortmund_202608/dortmund.MP3",         image: "https://archive.org/download/dortmund_202608/pexels-norbert-ueing-315693495-13612319.jpg",         location: { lat: 51.513530856785906, lon: 7.46581642781496 },         descriptionShort: "Удивительные факты о Дортмунде, которые стоит узнать каждому.",         subCategory: "Легенды и мифы города"     };
const florianturm = { name: "Флориантурм — первая вращающаяся башня в мире", distance: null, time: "5 мин", difficulty: "Лёгкая", image: "https://archive.org/download/florianturm/Florianturm_bei_Nacht.jpg", audioUrl: "https://archive.org/download/florianturm/florianturm.MP3", videoUrl: "https://youtu.be/-OSFfi_quDU", geoUrl: "https://maps.app.goo.gl/tjYL8ZVwsDpgx7zW6", location: { lat: 51.496278, lon: 7.476722 }, descriptionShort: "Флориантурм — телебашня высотой 211 метров и символ Дортмунда. Построена за неполный год в 1959 году. Первая в мире телебашня с вращающимся рестораном. Со смотровой площадки на высоте 142 метров открывается панорама всего Рурского региона.", subCategory: "Дортмунд" };
    // === КУРИРУЕМЫЕ РАЗДЕЛЫ (главный экран) ===
    curatedRecommended = [florianturm, dortmundFacts];
    curatedExplore = [dortmundFacts];
    curatedInteresting = [florianturm];

    // === КУЛЬТУРНЫЕ И ИСТОРИЧЕСКИЕ (8 подкатегорий) ===
    structure["Культурные и исторические маршруты"]["Набережная"] = [];
    structure["Культурные и исторические маршруты"]["Музеи и выставки"] = [];
    structure["Культурные и исторические маршруты"]["Памятники и мемориалы"] = [];
    structure["Культурные и исторические маршруты"]["Архитектурные достопримечательности"] = [dortmundFacts];
    structure["Культурные и исторические маршруты"]["Городские площади"] = [dortmundFacts];
    structure["Культурные и исторические маршруты"]["Исторические кварталы"] = [dortmundFacts];
    structure["Культурные и исторические маршруты"]["Церкви и храмы"] = [];
    structure["Культурные и исторические маршруты"]["Легенды и мифы города"] = [dortmundFacts];

    // === ПРИРОДНЫЕ И АКТИВНЫЕ (4 подкатегории) ===
    structure["Природные и активные маршруты"]["Природные зоны и парки"] = [];
    structure["Природные и активные маршруты"]["Горные и лесные маршруты"] = [];
    structure["Природные и активные маршруты"]["Активный отдых у воды"] = [];
    structure["Природные и активные маршруты"]["Спортивные площадки и фитнес-парки"] = [];

    // === СОВРЕМЕННЫЕ И УРБАНИСТИЧЕСКИЕ (4 подкатегории) ===
    structure["Современные и урбанистические маршруты"]["Скульптуры и уличное искусство"] = [];
    structure["Современные и урбанистические маршруты"]["Современная архитектура"] = [];
    structure["Современные и урбанистические маршруты"]["Городские лаборатории"] = [];
    structure["Современные и урбанистические маршруты"]["Реставрации и обновления"] = [];

    // === ГАСТРОНОМИЧЕСКИЕ (4 подкатегории) ===
    structure["Гастрономические маршруты"]["Кофе"] = [];
    structure["Гастрономические маршруты"]["Уличная еда"] = [];
    structure["Гастрономические маршруты"]["Традиционные рестораны"] = [];
    structure["Гастрономические маршруты"]["Гастрономические мастер-классы"] = [];

    // === СЕМЕЙНЫЕ (5 подкатегорий) ===
    structure["Семейные маршруты"]["Парки аттракционы и детские площадки"] = [];
    structure["Семейные маршруты"]["Зоопарки"] = [];
    structure["Семейные маршруты"]["Музеи для детей"] = [];
    structure["Семейные маршруты"]["Пикники на природе"] = [];
    structure["Семейные маршруты"]["Игровые центры и развлекательные зоны"] = [];

    // === АЛЬТЕРНАТИВНЫЕ (4 подкатегории) ===
    structure["Альтернативные маршруты"]["Заброшенные здания и территории"] = [];
    structure["Альтернативные маршруты"]["Урбанистические исследования"] = [dortmundFacts];
    structure["Альтернативные маршруты"]["Тайные и мистические маршруты"] = [];
    structure["Альтернативные маршруты"]["Ночные экскурсии"] = [];

    // === ТЕМАТИЧЕСКИЕ (5 подкатегорий) ===
    structure["Тематические маршруты"]["Музыкальные маршруты"] = [];
    structure["Тематические маршруты"]["Кино и телевидение"] = [];
    structure["Тематические маршруты"]["Мифы и легенды"] = [dortmundFacts];
    structure["Тематические маршруты"]["Технические и инновационные маршруты"] = [];
    structure["Тематические маршруты"]["Спортивные маршруты"] = [];


    // === НАПОЛНЕНИЕ РАЗДЕЛОВ ДЛЯ ДОРТМУНДА ===
    curatedRecommended = [dortmundFacts];
    curatedExplore = [dortmundFacts];
    curatedInteresting = [dortmundFacts];

    // --- ЗАПОЛНЕНИЕ КАТАЛОГА ДОРТМУНДА ---
    structure["Культурные и исторические маршруты"]["Легенды и мифы города"] = [dortmundFacts];


} else if (cityId === 'pitsunda') {
// --- ПЕРЕМЕННЫЕ ПИЦУНДЫ ---
const petushok = { 
    name: "Остановка Петушок", 
    distance: 0.1, 
    time: "5 мин", 
    difficulty: "Лёгкая", 
    image: "https://archive.org/download/pet-abh/2024_05_29-11_35_49.JPG", 
    audioUrl: "https://archive.org/download/pet-abh/Pet_ABH.MP3", 
    videoUrl: "https://youtu.be/579zdxuMx1g", 
    geoUrl: "https://maps.app.goo.gl/e2McWrWLpQws84No9", 
    location: { lat: 43.182452, lon: 40.292597 }, 
    descriptionShort: "Одна из немногих остановок Церетели в Абхазии — уникальный памятник советского монументального искусства на побережье Чёрного моря.", 
    subCategory: "Скульптуры и уличное искусство" 
};

const ritsaLake = {
    name: "Озеро Рица",
    distance: 0.5,
    time: "5 мин",
    difficulty: "Лёгкая",
    image: "https://archive.org/download/11876545678/11876545678.jpg",
    audioUrl: "https://archive.org/download/11876545678/RIZA_abh.MP3",
    videoUrl: "https://youtu.be/Yoieim_2rU8",
    geoUrl: "https://maps.app.goo.gl/TKdQodrsp23CgKy5A",
    location: { lat: 43.477987, lon: 40.536329 },
    descriptionShort: "Жемчужина Абхазии — высокогорное озеро Рица с кристально чистой водой бирюзового цвета, окружённое величественными горами и реликтовыми лесами. Одно из самых красивых мест Кавказа.",
    subCategory: "Природные зоны и парки"
};

const octopusStop = { 
        name: "Остановка Осминог", 
        author: "Церители",
        distance: 0.5, 
        time: "5 мин", 
        difficulty: "Лёгкая", 
        image: "https://archive.org/download/p-2-abh/photo_2025-04-23_00-40-04.jpg", 
        audioUrl: "https://archive.org/download/p-2-abh/P2_ABH.MP3", 
        videoUrl: "https://youtu.be/6fdxvGYpIwA",
        geoUrl: "https://maps.app.goo.gl/AMS5d5qc9M7U5aUg7", 
        location: { lat: 43.172163, lon: 40.314218 }, 
        descriptionShort: "Знаменитая остановка-скульптура Осминог в Пицунде", 
        subCategory: "Скульптуры и уличное искусство",
        explicitDate: "2025-04-23"
    };

// === НАПОЛНЕНИЕ РАЗДЕЛОВ ДЛЯ ПИЦУНДЫ ===
curatedRecommended = [ritsaLake];
curatedExplore = [petushok, octopusStop];
curatedInteresting = [petushok];

// --- ЗАПОЛНЕНИЕ КАТАЛОГА ПИЦУНДЫ ---
// === Культурные и исторические маршруты ===
structure["Культурные и исторические маршруты"]["Набережная"] = [petushok];
structure["Культурные и исторические маршруты"]["Музеи и выставки"] = [petushok];
structure["Культурные и исторические маршруты"]["Памятники и мемориалы"] = [petushok];
structure["Культурные и исторические маршруты"]["Архитектурные достопримечательности"] = [petushok, octopusStop];
structure["Культурные и исторические маршруты"]["Городские площади"] = [petushok];
structure["Культурные и исторические маршруты"]["Исторические кварталы"] = [petushok];
structure["Культурные и исторические маршруты"]["Церкви и храмы"] = [petushok];
structure["Культурные и исторические маршруты"]["Легенды и мифы города"] = [petushok, octopusStop];

// === Природные и активные маршруты ===
structure["Природные и активные маршруты"]["Природные зоны и парки"] = [petushok, ritsaLake];
structure["Природные и активные маршруты"]["Горные и лесные маршруты"] = [ritsaLake];
structure["Природные и активные маршруты"]["Активный отдых у воды"] = [ritsaLake, petushok];
structure["Природные и активные маршруты"]["Спортивные площадки и фитнес-парки"] = [petushok];

// === Современные и урбанистические маршруты ===
structure["Современные и урбанистические маршруты"]["Скульптуры и уличное искусство"] = [octopusStop, petushok];
structure["Современные и урбанистические маршруты"]["Современная архитектура"] = [petushok];
structure["Современные и урбанистические маршруты"]["Городские лаборатории"] = [petushok, octopusStop];
structure["Современные и урбанистические маршруты"]["Реставрации и обновления"] = [petushok];

// === Гастрономические маршруты ===
structure["Гастрономические маршруты"]["Кофе"] = [petushok];
structure["Гастрономические маршруты"]["Уличная еда"] = [petushok];
structure["Гастрономические маршруты"]["Традиционные рестораны"] = [petushok];
structure["Гастрономические маршруты"]["Гастрономические мастер-классы"] = [petushok];

// === Семейные маршруты ===
structure["Семейные маршруты"]["Парки аттракционы и детские площадки"] = [petushok];
structure["Семейные маршруты"]["Зоопарки"] = [petushok];
structure["Семейные маршруты"]["Музеи для детей"] = [petushok];
structure["Семейные маршруты"]["Пикники на природе"] = [petushok];
structure["Семейные маршруты"]["Игровые центры и развлекательные зоны"] = [petushok];

// === Альтернативные маршруты ===
structure["Альтернативные маршруты"]["Заброшенные здания и территории"] = [petushok];
structure["Альтернативные маршруты"]["Урбанистические исследования"] = [petushok, octopusStop];
structure["Альтернативные маршруты"]["Тайные и мистические маршруты"] = [ritsaLake, petushok];
structure["Альтернативные маршруты"]["Ночные экскурсии"] = [petushok];

// === Тематические маршруты ===
structure["Тематические маршруты"]["Музыкальные маршруты"] = [petushok];
structure["Тематические маршруты"]["Кино и телевидение"] = [petushok];
structure["Тематические маршруты"]["Мифы и легенды"] = [ritsaLake, petushok, octopusStop];
structure["Тематические маршруты"]["Технические и инновационные маршруты"] = [petushok];
structure["Тематические маршруты"]["Спортивные маршруты"] = [petushok];
}
return {
  structure: structure,
  curated: {
    recommended: curatedRecommended,
    explore: curatedExplore,
    interesting: curatedInteresting
  }
};
};

const Modal = ({ show, message, onClose, darkMode, buttonText, lang, onAction, actionButtonText }) => {
    if (!show) return null;
    const C = darkMode ? S.dark : S.light;
    const t = (k) => TRANSLATIONS[lang]?.[k] || k;
    const btnTxt = buttonText || t('close');
    
    return (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: '1rem' }}> 
            <div style={{ borderRadius: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '1.5rem', position: 'relative', width: '100%', maxWidth: '24rem', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.text }}> 
                <button onClick={onClose} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: '0.25rem', borderRadius: '9999px', color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <XCircle style={{ width: '1.5rem', height: '1.5rem' }} />
                </button> 
                
                {/* Добавили whiteSpace: 'pre-line' для корректного отображения \n */}
                <p style={{ fontSize: '1.125rem', fontWeight: 600, textAlign: 'center', marginTop: '1rem', marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
                    {message}
                </p> 

                {/* Новая кнопка действия (появляется только если передана) */}
                {onAction && actionButtonText && (
                    <button onClick={onAction} style={{ width: '100%', backgroundColor: S.emerald600, color: 'white', fontWeight: 600, padding: '0.75rem 0', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', marginBottom: '0.75rem' }}>
                        {actionButtonText}
                    </button>
                )}

                {/* Кнопка закрытия (теперь вторичная) */}
                <button onClick={onClose} style={{ width: '100%', backgroundColor: 'transparent', color: C.textMuted, fontWeight: 600, padding: '0.75rem 0', borderRadius: '0.75rem', border: `1px solid ${C.cardBorder}`, cursor: 'pointer' }}>
                    {btnTxt}
                </button> 
            </div> 
        </div>
    );
};

const ContactModal = ({ show, onClose, darkMode, lang }) => {
    const [copyStatus, setCopyStatus] = useState({});
    if (!show) return null;
    const C = darkMode ? S.dark : S.light;
    const t = (k) => TRANSLATIONS[lang]?.[k] || k;
    const contactLinks = [{ label: "Email", value: "memorial142@mail.ru", copyValue: "memorial142@mail.ru", url: "mailto:memorial142@mail.ru", icon: <Mail style={{ width: '1.25rem', height: '1.25rem', color: S.sky600 }} /> }, { label: "Telegram", value: "@Ya_Sam_42", copyValue: "Ya_Sam_42", url: "https://t.me/Ya_Sam_42", icon: <Send style={{ width: '1.25rem', height: '1.25rem', color: '#229ED9' }} /> }, { label: "Rutube", value: "Канал 'Я САМ'", copyValue: "https://rutube.ru/channel/69549307/", url: "https://rutube.ru/channel/69549307/", icon: <Clapperboard style={{ width: '1.25rem', height: '1.25rem', color: S.orange500 }} /> },];
    const handleCopy = (text, label) => { navigator.clipboard.writeText(text).then(() => { setCopyStatus(prev => ({ ...prev, [label]: 'Скопировано!' })); setTimeout(() => setCopyStatus(prev => ({ ...prev, [label]: null })), 2000); }); };
    const handleOpen = (url) => { window.open(url, '_blank', 'noopener,noreferrer'); };
    return (<div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: '1rem' }} onClick={onClose}> <div style={{ borderRadius: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '1.5rem', position: 'relative', width: '100%', maxWidth: '28rem', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.text }} onClick={e => e.stopPropagation()}> <h3 style={{ ...S.textXl, ...S.fontBold, marginBottom: '1.5rem', textAlign: 'center' }}>{t('contact')}</h3> <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}> {contactLinks.map(link => (<div key={link.label}> <div style={{ ...S.flex, ...S.itemsCenter, gap: '0.75rem', marginBottom: '0.5rem' }}> {link.icon} <div> <p style={{ ...S.fontSemibold, color: C.text }}>{link.label}</p> <p style={{ fontSize: '0.875rem', color: C.textMuted, wordBreak: 'break-all' }}>{link.value}</p> </div> </div> <div style={{ ...S.flex, gap: '0.5rem', marginTop: '0.5rem' }}> <button onClick={() => handleCopy(link.copyValue, link.label)} style={{ flex: 1, backgroundColor: S.emerald600, color: 'white', ...S.fontSemibold, ...S.py3, ...S.roundedXl, border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}> {copyStatus[link.label] || 'Копировать'} </button> <button onClick={() => handleOpen(link.url)} style={{ flex: 1, backgroundColor: 'transparent', color: C.text, ...S.fontSemibold, ...S.py3, ...S.roundedXl, border: `1px solid ${C.cardBorder}`, cursor: 'pointer', fontSize: '0.875rem' }}> Открыть </button> </div> </div>))} </div> <button onClick={onClose} style={{ width: '100%', marginTop: '2rem', backgroundColor: 'transparent', color: C.textMuted, ...S.fontSemibold, ...S.py3, ...S.roundedXl, border: `1px solid ${C.cardBorder}`, cursor: 'pointer' }}>{t('close')}</button> </div> </div>);
};

const NotificationPermissionModal = ({ show, onAllow, onLater, darkMode, lang }) => {
    if (!show) return null;
    const C = darkMode ? S.dark : S.light;
    const t = (k) => TRANSLATIONS[lang]?.[k] || k;
    
    return (
        <div style={{ 
            position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.4)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 160, padding: '1rem',
            backdropFilter: 'blur(4px)'
        }} onClick={onLater}>
            <div style={{ 
                borderRadius: '1.5rem', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
                padding: '2rem 1.5rem', 
                width: '100%', maxWidth: '22rem', 
                backgroundColor: C.cardBg, 
                border: `1px solid ${C.cardBorder}`, 
                color: C.text,
                textAlign: 'center'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                    {t('notif_permission_title')}
                </h3>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: C.textMuted, marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
                    {t('notif_permission_text')}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                    <button onClick={onAllow} style={{ 
                        width: '100%', backgroundColor: S.emerald600, color: 'white', 
                        fontWeight: 600, padding: '0.875rem 0', borderRadius: '0.75rem', 
                        border: 'none', cursor: 'pointer', fontSize: '1rem'
                    }}>
                        {t('notif_allow')}
                    </button>
                    <button onClick={onLater} style={{ 
                        width: '100%', backgroundColor: 'transparent', color: C.textMuted, 
                        fontWeight: 500, padding: '0.75rem 0', borderRadius: '0.75rem', 
                        border: `1px solid ${C.cardBorder}`, cursor: 'pointer', fontSize: '0.9rem'
                    }}>
                        {t('notif_later')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SelectionModal = ({ show, onClose, title, items, onSelect, currentId, darkMode, lang }) => {
    if (!show) return null;
    const C = darkMode ? S.dark : S.light;
    const t = (key) => TRANSLATIONS[lang]?.[key] || key;
    return (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 250, padding: '1rem' }} onClick={onClose}>
            <div style={{ backgroundColor: C.cardBg, borderRadius: '1.5rem', width: '100%', maxWidth: '20rem', padding: '1.5rem', color: C.text, border: `1px solid ${C.cardBorder}` }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem' }}>{title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {items.map(item => (
                        <button key={item.id || item.code} onClick={() => { onSelect(item.id || item.code); onClose(); }} style={{ padding: '1rem', borderRadius: '1rem', border: `1px solid ${C.cardBorder}`, backgroundColor: (currentId === (item.id || item.code)) ? S.emerald600 : C.bg, color: (currentId === (item.id || item.code)) ? 'white' : C.text, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {item.icon && <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>}
                            <span>{item.id ? t('city_' + item.id) : (item.label || item.name)}</span>
                        </button>
                    ))}
                </div>
                <button onClick={onClose} style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}>{t('cancel') || "Cancel"}</button>
            </div>
        </div>
    );
};

const CountryCityModal = ({ show, onClose, onSelectCity, currentCityId, darkMode, lang }) => {
    const [selectedCountry, setSelectedCountry] = useState(null);
    if (!show) return null;

    const t = (k) => TRANSLATIONS[lang]?.[k] || k;

    const C = darkMode ? {
        bg: 'rgba(0,0,0,0.6)', panel: '#0f172a', card: 'rgba(255,255,255,0.06)',
        text: '#f8fafc', muted: '#94a3b8', border: 'rgba(255,255,255,0.08)',
        accent: '#10b981', accentGlow: 'rgba(16,185,129,0.2)'
    } : {
        bg: 'rgba(0,0,0,0.4)', panel: '#ffffff', card: 'rgba(255,255,255,0.95)',
        text: '#0f172a', muted: '#64748b', border: 'rgba(0,0,0,0.06)',
        accent: '#10b981', accentGlow: 'rgba(16,185,129,0.1)'
    };

    const handleSelectCity = (cityId) => { onSelectCity(cityId); onClose(); };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: C.bg, zIndex: 250,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            backdropFilter: 'blur(6px)'
        }} onClick={onClose}>
            <div style={{
                width: '100%', maxWidth: '480px', backgroundColor: C.panel,
                borderRadius: '28px 28px 0 0', border: `1px solid ${C.border}`,
                borderBottom: 'none', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                boxShadow: darkMode ? '0 -10px 40px rgba(0,0,0,0.5)' : '0 -10px 40px rgba(0,0,0,0.15)'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Шапка */}
                <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: C.text }}>
                            {selectedCountry ? t('city') : 'Выберите страну'}
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: C.muted }}>
                            {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.label}` : 'Сначала страну, затем город'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '8px' }}>
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Кнопка назад */}
                {selectedCountry && (
                    <button onClick={() => setSelectedCountry(null)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', margin: '16px 24px 0',
                        background: 'none', border: 'none', color: C.accent, fontWeight: 600, fontSize: '14px', cursor: 'pointer'
                    }}>
                        <ArrowLeft size={18} /> Назад к странам
                    </button>
                )}

                {/* Контент */}
                <div style={{ overflowY: 'auto', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {!selectedCountry ? (
                        // --- СТРАНЫ ---
                        COUNTRY_GROUPS.map(country => (
                            <div key={country.id} onClick={() => setSelectedCountry(country)} style={{
                                background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px',
                                padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px',
                                cursor: 'pointer'
                            }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '14px',
                                    background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0
                                }}>{country.flag}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '16px', color: C.text }}>{country.label}</div>
                                    <div style={{ fontSize: '13px', color: C.muted, marginTop: '2px' }}>{country.cities.length} {country.cities.length === 1 ? 'город' : 'города'}</div>
                                </div>
                                <div style={{ color: C.accent, fontSize: '20px', fontWeight: 700 }}>→</div>
                            </div>
                        ))
                    ) : (
                        // --- ГОРОДА ---
                        selectedCountry.cities.map(city => {
                            const isActive = currentCityId === city.id;
                            return (
                                <div key={city.id} onClick={() => handleSelectCity(city.id)} style={{
                                    background: isActive ? C.accentGlow : C.card,
                                    border: `1.5px solid ${isActive ? C.accent : C.border}`, borderRadius: '16px',
                                    padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px',
                                    cursor: 'pointer'
                                }}>
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: isActive ? 'linear-gradient(135deg, #10B981, #059669)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <Building size={20} color={isActive ? '#fff' : C.muted} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '16px', color: C.text }}>{city.label}</div>
                                        <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>{selectedCountry.label}</div>
                                    </div>
                                    {isActive && (
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <CheckCircle size={16} color="#fff" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ИСПРАВЛЕННЫЙ АУДИОПЛЕЕР ---
const MiniAudioPlayer = forwardRef(({ route, onClose, darkMode, onAudioError }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isBuffering, setIsBuffering] = useState(false);
    const isBufferingRef = useRef(isBuffering);
    useEffect(() => { isBufferingRef.current = isBuffering; }, [isBuffering]);

    const { name: title, image, subCategory: artist, audioUrl } = route;

    useEffect(() => {
        const audioEl = ref.current;
        if (!audioEl || !audioUrl) return;

        const playAudio = () => {
            const playPromise = audioEl.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(e => {
                        console.log("Auto-play prevented or interrupted", e);
                        setIsPlaying(false);
                    });
            }
        };

        const handleTimeUpdate = () => {
            setProgress(audioEl.currentTime);
                        if (isBufferingRef.current && audioEl.readyState >= 3) setIsBuffering(false);
        };
        const handleLoadedMetadata = () => setDuration(audioEl.duration);
        const handleWaiting = () => setIsBuffering(true);
        const handlePlaying = () => { setIsPlaying(true); setIsBuffering(false); };
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => { setIsPlaying(false); onClose(); };
        const handleError = (e) => {
            console.error("Audio error", e);
            // Пытаемся перезагрузить, если ошибка сети
            if (audioEl.error && audioEl.error.code === 4) {
                 // network error, maybe try once?
            }
            // Не показываем ошибку сразу, даем шанс буферизации
            if (audioEl.readyState === 0) {
                 // onAudioError();
            }
        };

        // Сброс
        setIsPlaying(false);
        setProgress(0);
        setIsBuffering(true);
        
        audioEl.src = audioUrl;
        audioEl.load(); // Force load
        playAudio();

        audioEl.addEventListener("timeupdate", handleTimeUpdate);
        audioEl.addEventListener("loadedmetadata", handleLoadedMetadata);
        audioEl.addEventListener("waiting", handleWaiting);
        audioEl.addEventListener("playing", handlePlaying);
        audioEl.addEventListener("pause", handlePause);
        audioEl.addEventListener("ended", handleEnded);
        audioEl.addEventListener("error", handleError);

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new window.MediaMetadata({
                title: title || 'Аудиогид',
                artist: artist || 'Я САМ',
                artwork: [{ src: image || '', type: 'image/jpeg' }]
            });
            navigator.mediaSession.setActionHandler('play', playAudio);
            navigator.mediaSession.setActionHandler('pause', () => audioEl.pause());
        }

        return () => {
            audioEl.removeEventListener("timeupdate", handleTimeUpdate);
            audioEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audioEl.removeEventListener("waiting", handleWaiting);
            audioEl.removeEventListener("playing", handlePlaying);
            audioEl.removeEventListener("pause", handlePause);
            audioEl.removeEventListener("ended", handleEnded);
            audioEl.removeEventListener("error", handleError);
        };
    }, [audioUrl, title, artist, image, ref, onClose]); // Removed onClose from dependency to prevent re-runs

    const toggle = () => {
        const el = ref.current;
        if (!el) return;
        if (isPlaying) el.pause();
        else el.play();
    };

    const handleScrub = (e) => {
        const scrubTime = parseFloat(e.target.value);
        ref.current.currentTime = scrubTime;
        setProgress(scrubTime);
    };

    const downloadAudio = () => { window.open(audioUrl, '_system'); };

    const C = darkMode ? S.dark : S.light;
    const barColor = darkMode ? "#059669" : "#10b981";

    return (
        <div style={{ position: 'fixed', bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))', left: '1rem', right: '1rem', padding: '1rem', zIndex: 100, borderRadius: '1rem', boxShadow: '0 -10px 15px -3px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)', backgroundColor: C.cardBg, borderTop: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '9999px', color: C.text }}>
                {isBuffering ? <Loader className="animate-spin" style={{width: '1.5rem', height: '1.5rem'}} /> : (isPlaying ? <Pause style={{ width: '1.5rem', height: '1.5rem' }} /> : <PlayCircle style={{ width: '1.5rem', height: '1.5rem' }} />)}
            </button>
            <div style={{ flex: 1, margin: '0 1rem' }}>
                <input type="range" min="0" max={duration || 0} value={progress} onChange={handleScrub} style={{ width: '100%', height: '4px', cursor: 'pointer', background: `linear-gradient(to right, ${barColor} ${((progress / duration) * 100) || 0}%, #d1d5db ${((progress / duration) * 100) || 0}%)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
    <span style={{ fontSize: '0.75rem', color: C.text }}>
        {Math.floor(progress / 60)}:{String(Math.floor(progress % 60)).padStart(2, '0')}
    </span>
    <span style={{ fontSize: '0.75rem', color: C.text }}>
        {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
    </span>
</div>
            </div>
            <button onClick={downloadAudio} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: C.text }}><Download style={{ width: '1.25rem', height: '1.25rem' }} /></button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: C.text }}><XCircle style={{ width: '1.5rem', height: '1.5rem' }} /></button>
            {/* preload="auto" is key for slow connections */}
            <audio ref={ref} preload="auto" playsInline />
        </div>
    );
});

const LiquidMenu = ({ activeTab, onTabChange, onSearchClick, darkMode, lang }) => {
    const [isOpen, setIsOpen] = useState(false);
    const C = darkMode ? S.dark : S.light;
    const t = (k) => TRANSLATIONS[lang]?.[k] || k;

    const leftTabs = [
        { id: 'recommendations', icon: Home, label: t('rec') },
        { id: 'catalog', icon: Landmark, label: t('cat') },
    ];
    
    const rightTabs = [
    { id: 'dashboard', icon: Activity, label: 'Активность', isDashboard: true },
    { id: 'map', icon: MapIcon, label: t('map') },
];

   const handleTabClick = (tab) => {
    if (tab.isSearch) {
        onSearchClick();
    } else if (tab.isDashboard) {
        if (window.__showDashboard) window.__showDashboard();
        setIsOpen(false);
        return;
    } else {
        onTabChange(tab.id);
    }
    setIsOpen(false);
};

    const renderTabButton = (tab, index, side) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const delay = index * 0.05;
        
        return (
            <div
                key={tab.id}
                onClick={(e) => {
                    e.stopPropagation();
                    handleTabClick(tab);
                }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor: isActive 
                        ? (darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                        : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                    backdropFilter: 'blur(10px)',
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen 
                        ? 'translateX(0) scale(1)' 
                        : `translateX(${side === 'left' ? '30px' : '-30px'}) scale(0.5)`,
                    transition: `all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${delay}s`,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    minWidth: '52px',
                }}
            >
                <Icon 
                    size={22} 
                    color={isActive ? '#10B981' : (darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)')} 
                />
                <span style={{
                    fontSize: '0.6rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#10B981' : (darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'),
                    whiteSpace: 'nowrap',
                }}>
                    {tab.label}
                </span>
            </div>
        );
    };

    return (
        <>
            {/* Затемнение фона при открытом меню */}
            {isOpen && (
                <div 
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
                        zIndex: 190,
                    }}
                />
            )}

            {/* Контейнер меню */}
            <div style={{
                position: 'fixed',
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)',
                left: '0',
                right: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                zIndex: 200,
            }}>
                
                {/* Левые кнопки: Главная, Каталог */}
                {leftTabs.map((tab, index) => renderTabButton(tab, index, 'left'))}

                {/* Центральная сфера (кнопка меню) */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: isOpen 
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                            : 'linear-gradient(135deg, #10B981, #059669)',
                        boxShadow: isOpen
                            ? '0 0 30px rgba(239, 68, 68, 0.5), inset 0 0 15px rgba(255,255,255,0.2)'
                            : '0 0 30px rgba(16, 185, 129, 0.5), inset 0 0 15px rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        transform: isOpen ? 'scale(0.9)' : 'scale(1)',
                        animation: !isOpen ? 'spherePulse 3s ease-in-out infinite' : 'none',
                        flexShrink: 0,
                        position: 'relative',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        color: 'white',
                        transition: 'transform 0.3s ease',
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}>
                        {isOpen ? <XCircle size={28} /> : <Compass size={28} />}
                    </div>

                    {/* Кольца */}
                    {!isOpen && (
                        <>
                            <div style={{
                                position: 'absolute',
                                top: '-6px',
                                left: '-6px',
                                right: '-6px',
                                bottom: '-6px',
                                borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.2)',
                                animation: 'ringPulse 2s ease-in-out infinite',
                                pointerEvents: 'none',
                            }} />
                            <div style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '-12px',
                                right: '-12px',
                                bottom: '-12px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.1)',
                                animation: 'ringPulse 2s ease-in-out infinite 0.5s',
                                pointerEvents: 'none',
                            }} />
                        </>
                    )}
                </div>

                {/* Правые кнопки: Поиск, Карта */}
                {rightTabs.map((tab, index) => renderTabButton(tab, index, 'right'))}
            </div>

            {/* CSS анимации */}
            <style>{`
                @keyframes spherePulse {
                    0%, 100% {
                        box-shadow: 0 0 30px rgba(16, 185, 129, 0.5), inset 0 0 15px rgba(255,255,255,0.2);
                    }
                    50% {
                        box-shadow: 0 0 45px rgba(16, 185, 129, 0.7), inset 0 0 20px rgba(255,255,255,0.3);
                    }
                }
                
                @keyframes ringPulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.05); opacity: 0.15; }
                }
            `}</style>
        </>
    );
};

const SearchModal = ({ show, onClose, onNavigate, allRoutes, darkMode, lang }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const C = darkMode ? S.dark : S.light;
    const t = (k) => TRANSLATIONS[lang]?.[k] || k;

    useEffect(() => { if (!show) { setSearchTerm(''); setResults([]); } }, [show]);

    useEffect(() => {
        if (searchTerm.trim() === '') { setResults([]); return; }
        const term = searchTerm.toLowerCase();
        const filteredRoutes = allRoutes.filter(route =>
            route.name.toLowerCase().includes(term) ||
            (route.descriptionShort && route.descriptionShort.toLowerCase().includes(term))
        );
        setResults(filteredRoutes);
    }, [searchTerm, allRoutes]);

    const handleSelectRoute = (route) => { onNavigate('routeDetails', { route }); onClose(); };

    if (!show) return null;

    const overlayStyle = { position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 150, padding: '1rem', paddingTop: '4rem' };
    const modalBoxStyle = { width: '100%', maxWidth: '32rem', color: C.text, height: '100%', display: 'flex', flexDirection: 'column' };
    const inputStyle = { width: '100%', background: C.cardBg, border: 'none', borderRadius: '1rem', padding: '1rem 1.5rem', fontSize: '1.125rem', color: C.text, outline: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '1rem' };

    return (
        <div style={overlayStyle}>
            <div style={modalBoxStyle}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input type="text" placeholder={t('search_ph')} style={inputStyle} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.text, fontWeight: 600, cursor: 'pointer' }}>{t('cancel')}</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {results.map(route => (
                        <div key={route.name} onClick={() => handleSelectRoute(route)} style={{ ...S.wFull, padding: '1rem', borderBottom: `1px solid ${C.cardBorder}`, cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <img src={route.image} style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', objectFit: 'cover' }} alt="" />
                            <div>
                                <p style={{ ...S.fontSemibold }}>{route.name}</p>
                                <p style={{ fontSize: '0.8rem', color: C.textMuted }}>{route.subCategory}</p>
                            </div>
                        </div>
                    ))}
                    {searchTerm && results.length === 0 && <p style={{ ...S.p4, ...S.textCenter, color: C.textMuted }}>{t('nothing')}</p>}
                </div>
            </div>
        </div>
    );
};


const RouteDetailsPage = ({ route, darkMode, isFavorite, isCompleted, onBack, onPlayAudio, onToggleFavorite, onMarkCompleted, lang }) => {
    const C = darkMode ? S.dark : S.light;
    const t = (k) => TRANSLATIONS[lang]?.[k] || k;
    const steps = Math.floor(route.distance * 1250);
    const dailyGoal = 10000;
    const percent = Math.round((steps / dailyGoal) * 100);

    return (
        <div style={{ backgroundColor: C.bg, minHeight: '100vh', paddingBottom: '6rem' }}>
            <div style={{ position: 'relative', height: '40vh', width: '100%' }}>
                <img src={route.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={route.name} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))' }} />
                <button onClick={onBack} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 1rem)', left: '1rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}><ArrowLeft /></button>
                <div style={{ position: 'absolute', bottom: '2rem', left: '1.5rem', right: '1.5rem' }}>
                    <div style={{ color: S.emerald600, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>{t(route.subCategory) || route.subCategory}</div>
                    <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{route.name}</h1>
                </div>
            </div>
            <div style={{ position: 'relative', top: '-1.5rem', backgroundColor: C.bg, borderTopLeftRadius: '2rem', borderTopRightRadius: '2rem', padding: '2rem 1.5rem', boxShadow: '0 -10px 30px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', backgroundColor: C.cardBg, padding: '1rem', borderRadius: '1rem', border: `1px solid ${C.cardBorder}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}> <Navigation size={20} color={S.sky600} style={{ marginBottom: '0.25rem' }} /> <div style={{ fontWeight: 700, color: C.text }}>{route.distance} <span style={{ fontSize: '0.7rem', color: C.textMuted }}>{t('dist')}</span></div> </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}> <Clock size={20} color={S.orange500} style={{ marginBottom: '0.25rem' }} /> <div style={{ fontWeight: 700, color: C.text }}>{route.time.replace("мин", t("min"))}</div> </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}> <Activity size={20} color={S.emerald600} style={{ marginBottom: '0.25rem' }} /> <div style={{ fontWeight: 700, color: C.text }}>{steps} <span style={{ fontSize: '0.7rem', color: C.textMuted }}>{t('steps')}</span></div> <div style={{ fontSize: '0.65rem', color: S.emerald600, fontWeight: 600 }}>{percent}%</div> </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {route.audioUrl && (<button onClick={() => { onPlayAudio(route); if(window.__handleAudioGuideOpen) window.__handleAudioGuideOpen(); }} style={{ flex: 1, minWidth: '100px', backgroundColor: S.emerald600, color: 'white', border: 'none', padding: '1rem 0.5rem', borderRadius: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', cursor: 'pointer' }}> <PlayCircle size={20} /> {t('audio')} </button>)}
                    {route.videoUrl && (<button onClick={() => window.open(route.videoUrl, '_system')} style={{ flex: 1, minWidth: '100px', backgroundColor: S.red500, color: 'white', border: 'none', padding: '1rem 0.5rem', borderRadius: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}> <Clapperboard size={20} /> {t('video')} </button>)}
                    <button onClick={() => window.open(route.geoUrl)} style={{ flex: 1, minWidth: '100px', backgroundColor: C.cardBg, color: C.text, border: `1px solid ${C.cardBorder}`, padding: '1rem 0.5rem', borderRadius: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}> <Navigation size={20} /> {t('map_btn')} </button>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text, marginBottom: '0.75rem' }}>{t('about')}</h3>
                <p style={{ color: C.textMuted, lineHeight: '1.7', fontSize: '1rem', marginBottom: '2rem' }}>{route.descriptionShort}</p>
                <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: `1px solid ${C.cardBorder}`, paddingTop: '1.5rem' }}>
                    <button onClick={() => onToggleFavorite(route)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: isFavorite ? S.red500 : C.textMuted, cursor: 'pointer' }}> <Heart fill={isFavorite ? S.red500 : 'none'} /> <span style={{ fontSize: '0.8rem' }}>{t('to_fav')}</span> </button>
                    <button onClick={() => onMarkCompleted(route)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: isCompleted ? S.emerald600 : C.textMuted, cursor: 'pointer' }}> <CheckCircle /> <span style={{ fontSize: '0.8rem' }}>{t('visited')}</span> </button>
                </div>
            </div>
        </div>
    );
};

// ... (EditProfileModal, AccountPage, CatalogHeader - no changes needed, keeping compact)
const EditProfileModal = ({ show, onClose, darkMode, account, setAccount, lang }) => { const [newName, setNewName] = useState(account.name); const C = darkMode ? S.dark : S.light; const t = (k) => TRANSLATIONS[lang]?.[k] || k; if (!show) return null; return (<div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 160, padding: '1rem' }} onClick={onClose}> <div style={{ borderRadius: '0.75rem', padding: '1.5rem', width: '100%', maxWidth: '24rem', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.text }} onClick={e => e.stopPropagation()}> <h3 style={{ ...S.textXl, ...S.fontBold, marginBottom: '1.5rem', textAlign: 'center' }}>{t('profile')}</h3> <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${C.cardBorder}`, backgroundColor: C.bg, color: C.text, marginBottom: '1.5rem' }} placeholder="Имя" /> <div style={{ ...S.flex, gap: '0.5rem' }}> <button onClick={() => { if(newName.trim()) setAccount(prev => ({...prev, name: newName.trim()})); onClose(); }} style={{ flex: 1, backgroundColor: S.emerald600, color: 'white', padding: '0.75rem', borderRadius: '0.75rem', border: 'none' }}>{t('save')}</button> <button onClick={onClose} style={{ flex: 1, backgroundColor: C.cardBorder, color: C.text, padding: '0.75rem', borderRadius: '0.75rem', border: 'none' }}>{t('cancel')}</button> </div> </div> </div>); };

const AccountPage = ({ account, onBack, darkMode, setAccount, lang, completedRoutes, favoriteRoutes, navigate, isGuest, currentUserHash }) => {
  const C = darkMode ? S.dark : S.light; 
  const t = (k) => TRANSLATIONS[lang]?.[k] || k; 
  const [showEditModal, setShowEditModal] = useState(false);

  // 1. ЛОГИКА ГЕЙМИФИКАЦИИ: Расчет текущего и следующего уровня
  const rewardTiers = [
    { count: 1, title: "Начинающий", icon: "🌱" }, 
    { count: 3, title: "Исследователь", icon: "🧭" }, 
    { count: 5, title: "Магистр", icon: "👑" },
    { count: 10, title: "Легенда города", icon: "🏆" }
  ];
  
  let currentTier = rewardTiers[0];
  let nextTier = rewardTiers[1];
  for (let i = rewardTiers.length - 1; i >= 0; i--) {
    if (account.completedRoutesCount >= rewardTiers[i].count) {
      currentTier = rewardTiers[i];
      nextTier = rewardTiers[i + 1] || null;
      break;
    }
  }
  
  const progressPercent = nextTier 
    ? Math.min(((account.completedRoutesCount - currentTier.count) / (nextTier.count - currentTier.count)) * 100, 100) 
    : 100;
  const routesToNext = nextTier ? nextTier.count - account.completedRoutesCount : 0;

  // 2. ЛОГИКА ГРАФИКА: Активность за последние 7 дней
  const activityData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = completedRoutes.filter(r => r.isoDate && r.isoDate.startsWith(dateStr)).length;
    activityData.push({ 
      day: d.toLocaleDateString('ru-RU', { weekday: 'short' }), 
      count 
    });
  }
  const maxCount = Math.max(...activityData.map(d => d.count), 1);

  return (
    <div style={{ padding: '0 0 120px 0', minHeight: '100vh', backgroundColor: C.bg, color: C.text }}>
      {/* HEADER */}
      <div style={{ padding: '50px 20px 20px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onBack} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{t('profile')}</h2>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* КАРТОЧКА ПОЛЬЗОВАТЕЛЯ И УРОВНЯ */}
        <div style={{ background: C.cardBg, borderRadius: '24px', border: `1px solid ${C.border}`, padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Фоновый градиент для красоты */}
          <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(40px)' }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #059669)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'white', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)' }}>
              <User size={40} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0' }}>
    {isGuest ? 'Гость' : (account.name === 'Гость' && currentUserHash ? currentUserHash.slice(0, 8) + '...' : account.name)}
</h3>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              <span>{currentTier.icon}</span> {currentTier.title}
            </div>

            {/* ПРОГРЕСС-БАР ГЕЙМИФИКАЦИИ */}
            {nextTier && (
              <div style={{ marginTop: '20px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textMuted, marginBottom: '6px', fontWeight: 600 }}>
                  <span>Прогресс до «{nextTier.title}»</span>
                  <span>{account.completedRoutesCount} / {nextTier.count}</span>
                </div>
                <div style={{ height: '8px', background: C.border, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #10B981, #34D399)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
                <p style={{ fontSize: '12px', color: '#10B981', marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔥 Пройдите ещё {routesToNext} маршрута{routesToNext === 1 ? '' : routesToNext < 5 ? 'а' : 'ов'}, чтобы повысить уровень!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* СЕТКА СТАТИСТИКИ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Маршрутов прройдено', value: account.completedRoutesCount, icon: '🗺️', color: '#3B82F6', onClick: () => navigate('progress') },
{ label: 'Наград', value: account.rewards.length, icon: '🏅', color: '#F59E0B', onClick: null },
{ label: 'Дней в приложении', value: isGuest ? '—' : '7+', icon: '📅', color: '#8B5CF6', onClick: null },
{ label: 'Избранное', value: favoriteRoutes?.length || 0, icon: '❤️', color: '#EF4444', onClick: () => navigate('favorites') }
          ].map((stat, idx) => (
            <div key={idx} onClick={stat.onClick} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 8px', textAlign: 'center', cursor: stat.onClick ? 'pointer' : 'default' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: C.text }}>{stat.value}</div>
              <div style={{ fontSize: '10px', color: C.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>

       {/* ГРАФИК АКТИВНОСТИ */}
<div style={{ background: C.cardBg, borderRadius: '24px', border: `1px solid ${C.border}`, padding: '20px', position: 'relative', overflow: 'hidden' }}>
  
  {/* ФОНОВАЯ СЕТКА И "ПРИЗРАЧНЫЕ" ГРАФИКИ */}
  <div style={{
    position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none',
    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 19px, ${C.textMuted} 20px)`,
  }} />
  <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '80px', opacity: 0.1, pointerEvents: 'none' }} viewBox="0 0 100 40" preserveAspectRatio="none">
    <path d="M0,30 Q15,10 30,25 T60,15 T100,30 L100,40 L0,40 Z" fill="#10B981" />
    <path d="M0,35 Q20,5 40,20 T80,10 T100,35 L100,40 L0,40 Z" fill="#10B981" opacity="0.5" />
  </svg>

  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
    <Activity size={16} color="#10B981" /> Активность за 7 дней
  </h4>
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '80px', gap: '8px', position: 'relative', zIndex: 1 }}>
    {activityData.map((day, idx) => (
      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <div style={{ 
          width: '100%', maxWidth: '24px', 
          height: `${Math.max((day.count / maxCount) * 60, 4)}px`, 
          background: day.count > 0 ? 'linear-gradient(to top, #10B981, #34D399)' : C.border,
          borderRadius: '6px',
          transition: 'height 0.5s ease',
          boxShadow: day.count > 0 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
        }} />
        <span style={{ fontSize: '11px', color: C.textMuted, fontWeight: 600 }}>{day.day}</span>
      </div>
    ))}
  </div>
</div>

        {/* ДОСТИЖЕНИЯ / НАГРАДЫ */}
        {account.rewards.length > 0 && (
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', paddingLeft: '4px' }}>Ваши достижения</h4>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {account.rewards.map((reward, idx) => (
                <div key={idx} style={{ 
                  minWidth: '120px', background: C.cardBg, border: `1px solid ${C.border}`, 
                  borderRadius: '16px', padding: '16px', textAlign: 'center', flexShrink: 0 
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏆</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{reward}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* КНОПКА РЕДАКТИРОВАНИЯ */}
        <button 
          onClick={() => { if(!isGuest) setShowEditModal(true); }}
          style={{ 
            opacity: isGuest ? 0.4 : 1,
            cursor: isGuest ? 'not-allowed' : 'pointer',
            width: '100%', padding: '16px', borderRadius: '16px', border: 'none', 
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white', 
            fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '8px',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
          }}
        >
          {t('change_photo')} / {t('profile')}
        </button>

        <button 
          onClick={() => { if(window.__handleLogout) window.__handleLogout(); }} 
          style={{ 
            width: '100%', padding: '16px', borderRadius: '16px',
            background: 'transparent',
            color: isGuest ? S.emerald600 : '#EF4444',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '8px',
            border: `1.5px solid ${isGuest ? S.emerald600 : '#EF4444'}`,
          }}
        >
          {isGuest ? '👤 Зарегистрироваться' : '🚪 Выйти из аккаунта'}
        </button>

      </div>
      <EditProfileModal show={showEditModal} onClose={() => setShowEditModal(false)} darkMode={darkMode} account={account} setAccount={setAccount} lang={lang} /> 
    </div>
  ); 
};

const CatalogHeader = ({ title, onBack, darkMode }) => { 
    const C = darkMode ? S.dark : S.light; 
    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '1.5rem', 
            position: 'relative',
            minHeight: '40px'
        }}> 
            {onBack ? (
                <button 
                    onClick={onBack} 
                    style={{ 
                        background: C.cardBg, 
                        border: `1px solid ${C.cardBorder}`, 
                        borderRadius: '50%', 
                        width: '40px', 
                        height: '40px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer', 
                        color: C.text,
                        marginRight: '0.75rem',
                        flexShrink: 0,
                        boxShadow: C.shadow
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
            ) : <div style={{ width: '40px', flexShrink: 0 }} />}
            <h2 style={{ 
                fontSize: '1.25rem', 
                lineHeight: '1.75rem',
                fontWeight: 800, 
                textAlign: 'center', 
                flex: 1, 
                margin: 0,
                color: C.text
            }}>
                {title}
            </h2>
            {/* Пустой блок справа для симметрии, чтобы заголовок оставался по центру */}
            <div style={{ width: '40px', flexShrink: 0 }} />
        </div>
    ); 
};
const RouteListItem = React.memo(({ route, onNavigate, onPlayAudio, onToggleFavorite, isFavorite, userLocation, formatDistance, C, isCompleted, subtitle, lang }) => {
    const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lon, route.location?.lat, route.location?.lon) : 0;
    const steps = Math.floor(route.distance * 1250);
    const t = (k) => TRANSLATIONS[lang]?.[k] || k;
    return (
        <div onClick={() => onNavigate(route)} style={{ ...cardStyle, backgroundColor: C.cardBg, borderColor: isCompleted ? S.emerald600 : (C.cardBorder || 'transparent'), display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', boxShadow: C.shadow }}>
            <div style={{ position: 'relative', width: '5rem', height: '5rem', flexShrink: 0 }}> <img src={route.image} alt={route.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem', backgroundColor: C.cardBorder }} /> {route.audioUrl && (<div style={{ position: 'absolute', bottom: '0.25rem', right: '0.25rem', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '0.25rem' }}> <Music size={12} color="white" /> </div>)} </div>
            <div style={{ flex: 1, minWidth: 0 }}> <h3 style={{ ...S.fontSemibold, fontSize: '1rem', lineHeight: '1.3', color: C.text, marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route.name}</h3> {subtitle ? (<p style={{ fontSize: '0.8rem', color: S.emerald600, fontWeight: 600 }}>{subtitle}</p>) : (<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: C.textMuted }}> <span style={{ color: S.emerald600, fontWeight: 600 }}>👣 {steps} <span style={{ color: C.textMuted, fontWeight: 400 }}>({formatDistance(distance)})</span></span> <span><Clock size={12} /> {route.time.replace("мин", t("min"))}</span> </div>)} </div>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}> {route.audioUrl && (<button onClick={e => { e.stopPropagation(); onPlayAudio(route); }} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', padding: '0.6rem', borderRadius: '50%', color: S.emerald600, marginRight: '0.5rem' }}><PlayCircle size={22} /></button>)} <button onClick={e => { e.stopPropagation(); onToggleFavorite(route); }} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', padding: '0.6rem', borderRadius: '50%', color: isFavorite ? S.red500 : C.textMuted }}><Heart size={22} fill={isFavorite ? S.red500 : 'none'} /></button> </div>
        </div>
    );
});

// --- ИСПРАВЛЕННАЯ КАРТА (ZOOM FIX) ---
const MapPage = ({ userLocation, allRoutes, completedRoutes, onNavigate, darkMode, centerCity }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    // Храним ID последнего города, чтобы центрировать только при смене города
    const lastCityIdRef = useRef(null);

    
    
    const centerCityRef = useRef(centerCity);
    useEffect(() => { centerCityRef.current = centerCity; }, [centerCity]);
    const userLocationRef = useRef(userLocation);
    useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

    const allRoutesRef = useRef(allRoutes);
    useEffect(() => { allRoutesRef.current = allRoutes; }, [allRoutes]);
    const completedRoutesRef = useRef(completedRoutes);
    useEffect(() => { completedRoutesRef.current = completedRoutes; }, [completedRoutes]);
    const onNavigateRef = useRef(onNavigate);
    useEffect(() => { onNavigateRef.current = onNavigate; }, [onNavigate]);

     const initMap = useCallback(() => {
        if (!window.L || mapInstanceRef.current) return;
        const cc = centerCityRef.current;
        const ul = userLocationRef.current;
        const startLat = cc ? cc.lat : (ul ? ul.lat : 55.354);
        const startLon = cc ? cc.lon : (ul ? ul.lon : 86.087);
        const map = window.L.map(mapRef.current, { center: [startLat, startLon], zoom: 13, zoomControl: false });
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
        mapInstanceRef.current = map;
        lastCityIdRef.current = cc ? cc.id : null;
        updateMarkers(map);
    }, [updateMarkers]);
   const updateMarkers = useCallback((map) => {
        const L = window.L;
        const ul = userLocationRef.current;
        const ar = allRoutesRef.current;
        const cr = completedRoutesRef.current;
        const onNav = onNavigateRef.current;
        
        if (ul) {
            const userIcon = L.divIcon({ className: 'custom-icon', html: `<div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
            L.marker([ul.lat, ul.lon], { icon: userIcon }).addTo(map);
        }
        ar.forEach(route => {
            if (!route.location) return;
            const isCompleted = cr.some(c => c.name === route.name);
            const style = getCategoryStyle(route.subCategory);
            const color = isCompleted ? '#059669' : '#3b82f6';
            const iconHtml = `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${style.svgString}</div>`;
            const routeIcon = L.divIcon({ className: 'route-icon', html: iconHtml, iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18] });
            const marker = L.marker([route.location.lat, route.location.lon], { icon: routeIcon }).addTo(map);
            marker.on('click', () => onNav(route));
        });
    }, []);



    useEffect(() => {
        if (!document.getElementById('leaflet-css')) { const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link); }
        if (!document.getElementById('leaflet-js')) { const script = document.createElement('script'); script.id = 'leaflet-js'; script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async = true; script.onload = () => initMap(); document.body.appendChild(script); } else { initMap(); }
        return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
    }, [initMap]);



    useEffect(() => {
        if (window.L && mapInstanceRef.current) {
            // Центрируем карту ТОЛЬКО если сменился город
            if (centerCity && centerCity.id !== lastCityIdRef.current) {
                mapInstanceRef.current.setView([centerCity.lat, centerCity.lon], 13);
                lastCityIdRef.current = centerCity.id;
            }
            
            mapInstanceRef.current.eachLayer((layer) => { if (layer instanceof window.L.Marker) { mapInstanceRef.current.removeLayer(layer); } });
            updateMarkers(mapInstanceRef.current);
        }
    }, [userLocation, allRoutes, completedRoutes, centerCity, updateMarkers]);

   
    return <div ref={mapRef} style={{ width: '100%', height: 'calc(100vh - 5rem)', zIndex: 1 }} />;
};

const RecommendationTile = ({ route, onClick, C, formatDistance, userLocation, lang }) => {
    const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lon, route.location?.lat, route.location?.lon) : 0;
    const steps = Math.floor(route.distance * 1250);
    const t = (k) => TRANSLATIONS[lang]?.[k] || k;
    
    return (
        <div onClick={() => onClick(route)} style={{ 
            minWidth: '38%',
            height: '9.5rem',
            borderRadius: '1rem',
            position: 'relative', 
            overflow: 'hidden', 
            cursor: 'pointer', 
            boxShadow: C.cardShadow, 
            border: `1px solid ${C.border}`,
            flexShrink: 0,
        }}>
            <img src={route.image} alt={route.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', 
                padding: '0.5rem 0.6rem 0.5rem 0.6rem',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'flex-end' 
            }}>
                <div style={{ 
                    color: '#10B981', 
                    fontWeight: 600, 
                    fontSize: '0.6rem', 
                    textTransform: 'uppercase', 
                    marginBottom: '0.15rem',
                    lineHeight: 1.1,
                }}>{t(route.subCategory)}</div>
                <h3 style={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    fontSize: '0.85rem', 
                    margin: '0 0 0.2rem 0', 
                    lineHeight: 1.15, 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden' 
                }}>{route.name}</h3>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    color: 'rgba(255,255,255,0.85)', 
                    fontSize: '0.7rem', 
                    fontWeight: 500 
                }}>
                    <span>👣 {steps}</span>
                </div>
            </div>
        </div>
    );
};

function MainRouteApp({ onExit, setAccount, logEvent, showSurvey, onGoToRegister, ...props }) {
    const { favoriteRoutes, completedRoutes, handleRouteCompletionGlobal, isRouteInFavorites, toggleFavorite, account, darkMode, setDarkMode, units, setUnits, routeIcons, buildInfo, setShowContactModal, currentLang, setCurrentLang, currentCity, setCurrentCity, isGuest, currentUserHash } = props;
    
    // === ОПРЕДЕЛЕНИЕ ПЛАТФОРМЫ ===
    // Проверяем, запущено ли приложение как нативное (Capacitor на Android/iOS)
    const isNative = window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' 
        ? window.Capacitor.isNativePlatform() 
        : false;

    const [navigationStack, setNavigationStack] = useState([{ type: 'home' }]);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalAction, setModalAction] = useState(null);
    const [modalActionText, setModalActionText] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [currentPlayingRoute, setCurrentPlayingRoute] = useState(null);
    const [activeTab, setActiveTab] = useState('recommendations');
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [showLangModal, setShowLangModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [notifiedRoutes, setNotifiedRoutes] = useState(new Set());
    const [appNotifications, setAppNotifications] = useState([]);
    const [showNotifPermissionModal, setShowNotifPermissionModal] = useState(false);
    const routesData = useMemo(() => getRoutesData(currentCity, currentLang), [currentCity, currentLang]);
    const activeRoutes = routesData.structure;
    const curatedRoutes = routesData.curated || { recommended: [], explore: [], interesting: [] };
    const audioPlayerRef = useRef(null);
    const settingsRef = useRef(null);
    const C = darkMode ? S.dark : S.light;
    const currentView = navigationStack[navigationStack.length - 1];
    const t = (k) => TRANSLATIONS[currentLang]?.[k] || k;

    // ... (далее идет ваш существующий код useEffect и логики) ...
        useEffect(() => {
        const handleSystemChecks = async () => {
            try {
                const response = await fetch(VERSION_CHECK_URL);
                if (response.ok) {
                    const data = await response.json();
                    if (parseFloat(data.version) > parseFloat(buildInfo.version)) {
                        setAppNotifications(prev => { if (prev.find(n => n.type === 'update')) return prev; return [...prev, { id: 'update', type: 'update', title: 'Обновление', text: `Доступна версия ${data.version}.`, actionUrl: RUSTORE_LINK }]; });
                    }
                }
            } catch (e) { }
        };
        handleSystemChecks();
        }, [buildInfo.version]);

    const allRoutesFlatForSearch = useMemo(() => { return Object.values(activeRoutes).flatMap(cat => Object.values(cat).flat()); }, [activeRoutes]);
    const uniqueAllRoutes = useMemo(() => { const unique = new Map(); 
        
        allRoutesFlatForSearch.forEach(r => { if (!unique.has(r.name)) unique.set(r.name, r); }); return Array.from(unique.values()); }, [allRoutesFlatForSearch]);
// Запрос разрешений на уведомления
// Запрос разрешений на уведомления
useEffect(() => {
    const checkPermissions = async () => {
        const result = await LocalNotifications.checkPermissions();
        
        // Если уже разрешено — ничего не делаем
        if (result.display === 'granted') return;
        
        // Если запрещено или не спрашивали — показываем модалку через 3 секунды
        setTimeout(() => {
            setShowNotifPermissionModal(true);
        }, 3000);
    };
    checkPermissions();
}, []);

// Обработчики модалки разрешений
const handleAllowNotifications = async () => {
    setShowNotifPermissionModal(false);
    const result = await LocalNotifications.requestPermissions();
    if (result.display === 'granted') {
        setModalMessage(t('notif_permission_title') + ' ✅');
        setShowModal(true);
    }
};

const handleLaterNotifications = () => {
    setShowNotifPermissionModal(false);
    // Запомним, что пользователь отложил (можно спросить через день)
    localStorage.setItem('notifPermissionAskedAt', Date.now());
};
    useEffect(() => {
    const geoSuccess = (position) => {
        const lat = position.coords.latitude; 
        const lon = position.coords.longitude; 
        setUserLocation({ lat, lon });
        
        // Находим все маршруты в радиусе 150м и сортируем по близости
const nearbyRoutes = allRoutesFlatForSearch
    .filter(route => {
        if (!route.location) return false;
        if (notifiedRoutes.has(route.name)) return false; // уже уведомляли
        
        const distanceKm = calculateDistance(lat, lon, route.location.lat, route.location.lon);
        const distanceMeters = distanceKm * 1000;
        return distanceMeters <= 150;
    })
    .map(route => {
        const distanceKm = calculateDistance(lat, lon, route.location.lat, route.location.lon);
        return {
            ...route,
            distanceMeters: Math.round(distanceKm * 1000)
        };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters); // сортируем: ближайший первый

// Уведомляем только о БЛИЖАЙШЕМ маршруте (не чаще раз в 5 минут)
if (nearbyRoutes.length > 0) {
    const lastNotifTime = parseInt(localStorage.getItem('lastRouteNotification') || '0');
    const now = Date.now();
    const timeSinceLastNotif = now - lastNotifTime;
    const minInterval = 5 * 60 * 1000; // 5 минут
    
    if (timeSinceLastNotif >= minInterval) {
        const closestRoute = nearbyRoutes[0]; // берём самый близкий
        
        LocalNotifications.schedule({ 
            notifications: [{ 
                title: "Рядом интересный маршрут! 🎧", 
                body: `${closestRoute.name} (${closestRoute.distanceMeters} м)\nПослушать аудиогид?`, 
                id: Math.floor(Math.random() * 100000), 
                schedule: { at: new Date(Date.now() + 100) },
                sound: 'default',
                extra: { 
                    routeId: closestRoute.name,
                    routeData: JSON.stringify(closestRoute)
                } 
            }] 
        });
        
        setNotifiedRoutes(prev => new Set(prev).add(closestRoute.name));
        localStorage.setItem('lastRouteNotification', now.toString());
    }
}
    };

        const geoError = () => {
        const city = CITIES.find(c => c.id === currentCity);
        if (city) setUserLocation({ lat: city.lat, lon: city.lon });
    };
    
    // При смене города сразу ставим координаты города
    const cityCoords = CITIES.find(c => c.id === currentCity);
    if (cityCoords) {
        setUserLocation(prev => {
            if (!prev || !navigator.geolocation) return { lat: cityCoords.lat, lon: cityCoords.lon };
            return prev;
        });
    }
    
    let watchId; 
    if (navigator.geolocation) { 
        watchId = navigator.geolocation.watchPosition(geoSuccess, geoError, { 
            enableHighAccuracy: true,
            maximumAge: 10000, // обновление каждые 10 сек
            timeout: 5000
        }); 
    } else { 
        geoError(); 
    }
    
    return () => { 
        if (watchId) navigator.geolocation.clearWatch(watchId); 
    };
}, 
  [allRoutesFlatForSearch, notifiedRoutes, currentCity]);

    const allRoutesFlat = useMemo(() => { return Object.keys(activeRoutes).flatMap(topCat => Object.keys(activeRoutes[topCat]).flatMap(subCat => activeRoutes[topCat][subCat])); }, [activeRoutes]);

    // 1. РЯДОМ С ВАМИ (сортировка по расстоянию, топ-5)
    const nearbyRoutesForHome = useMemo(() => {
        if (!allRoutesFlat.length || !userLocation) return [];
        const city = CITIES.find(c => c.id === currentCity);
        const loc = userLocation || (city ? { lat: city.lat, lon: city.lon } : null);
        if (!loc) return [];
        const uniqueRoutes = new Map();
        allRoutesFlat.forEach(route => {
            if (!uniqueRoutes.has(route.name)) {
                uniqueRoutes.set(route.name, {
                    ...route,
                    calculatedDistance: calculateDistance(loc.lat, loc.lon || loc.lng, route.location?.lat, route.location?.lon)
                });
            }
        });
        return Array.from(uniqueRoutes.values()).sort((a, b) => a.calculatedDistance - b.calculatedDistance).slice(0, 5);
    }, [userLocation, allRoutesFlat, currentCity]);

    // Собираем имена маршрутов, которые УЖЕ показаны в "Рядом с вами"
    const nearbyRouteNames = useMemo(() => {
        const names = new Set();
        nearbyRoutesForHome.forEach(r => names.add(r.name));
        return names;
    }, [nearbyRoutesForHome]);

    // 2. РЕКОМЕНДУЕМ (НЕЗАВИСИМЫЙ БЛОК: без проверок, без фильтров, как вы и просили)
    const recommendedCurated = useMemo(() => {
        return curatedRoutes.recommended || [];
    }, [curatedRoutes.recommended]);

    // 3. ИССЛЕДУЙ (исключаем только те маршруты, что уже есть в "Рядом с вами")
    const exploreCurated = useMemo(() => {
        return (curatedRoutes.explore || []).filter(r => !nearbyRouteNames.has(r.name));
    }, [curatedRoutes.explore, nearbyRouteNames]);

    // Собираем имена маршрутов, которые уже есть в "Рядом с вами" И в "Исследуй"
    const nearbyAndExploreNames = useMemo(() => {
        const names = new Set(nearbyRouteNames);
        exploreCurated.forEach(r => names.add(r.name));
        return names;
    }, [nearbyRouteNames, exploreCurated]);

    // 4. ИНТЕРЕСНОЕ (исключаем те, что уже в "Рядом" и "Исследуй")
    const interestingCurated = useMemo(() => {




        return (curatedRoutes.interesting || []).filter(r => !nearbyAndExploreNames.has(r.name));
    }, [curatedRoutes.interesting, nearbyAndExploreNames]);


const stopAudio = useCallback(() => { if (audioPlayerRef.current) { audioPlayerRef.current.pause(); } setCurrentPlayingRoute(null); }, []);
const goBack = useCallback(() => { setNavigationStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev)); }, []);
const navigate = useCallback((type, data = {}) => { if (type === 'routeDetails') { stopAudio(); } setNavigationStack(prev => [...prev, { type, ...data }]); }, [stopAudio]);
const playAudio = useCallback((route) => { if (route && route.audioUrl) { setCurrentPlayingRoute(route);   logEvent('audio_play', { routeName: route.name, city: currentCity });                if (window.__trackAudioInteraction) {          window.__trackAudioInteraction();        }    } else {        setModalMessage("Нет аудиогида");        setShowModal(true);    }}, [logEvent, currentCity]);




// Обработка нажатия на уведомление
useEffect(() => {
    let listener = null;
    
    const setupListener = async () => {
        try {
            listener = await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
                const routeData = notification.notification.extra?.routeData;
                if (routeData) {
                    try {
                        const route = JSON.parse(routeData);
                        navigate('routeDetails', { route });
                        setActiveTab('recommendations');
                    } catch (e) {
                        console.error('Ошибка парсинга маршрута из уведомления:', e);
                    }
                }
            });
        } catch (e) {
            console.log('Notification listener not available');
        }
    };
    
    setupListener();
    
    return () => {
        if (listener && typeof listener.remove === 'function') {
            listener.remove();
        }
    };
}, [navigate]);

    
// Глобальный метод для показа промпта регистрации
useEffect(() => {
 window.__showRegistrationPrompt = () => {
    setModalMessage('Вам нравится приложение? 💚\nСоздайте аккаунт, чтобы сохранять маршруты в избранное, отмечать прогресс и синхронизировать данные между устройствами.');
    setModalActionText('Создать аккаунт');
    setModalAction(() => {
        setShowModal(false);
        if (onGoToRegister) onGoToRegister();
    });
    setShowModal(true);
};
  
  return () => {
    delete window.__showRegistrationPrompt;
  };
}, [onGoToRegister]);

    // Пауза аудио при открытии опроса
useEffect(() => {
  if (showSurvey && currentPlayingRoute) {
    stopAudio();
  }
}, [showSurvey, currentPlayingRoute, stopAudio]);
   
const handleTabChange = useCallback((tabId) => { setActiveTab(tabId); if (tabId === 'catalog') { setNavigationStack([{ type: 'categories' }]); } else { setNavigationStack([{ type: 'home' }]); } }, []);

    useEffect(() => { 
    let listener = null;
    
    const setupListener = async () => {
        try {
            listener = await CapacitorApp.addListener('backButton', () => { 
                if (navigationStack.length > 1) { 
                    goBack(); 
                    return; 
                } 
                onExit(); 
            });
        } catch (e) {
            console.log('BackButton listener not available');
        }
    };
    
    setupListener();
    
    return () => { 
        if (listener && typeof listener.remove === 'function') {
            listener.remove(); 
        }
    }; 
}, [navigationStack.length, goBack, onExit]);
    useEffect(() => { const handleClickOutside = (event) => { if (settingsRef.current && !settingsRef.current.contains(event.target)) { setSettingsOpen(false); } }; if (settingsOpen) { document.addEventListener("mousedown", handleClickOutside); } return () => { document.removeEventListener("mousedown", handleClickOutside); }; }, [settingsOpen]);
   const formatDistance = useCallback(km => units === 'mi' ? `${(km * 0.621371).toFixed(2)} mi` : `${km.toFixed(2)} ${TRANSLATIONS[currentLang]?.['dist'] || 'км'}`, [units, currentLang]);

      const settingsItems = [
        //{ label: t('completed'), action: () => { navigate('progress'); setSettingsOpen(false); }, icon: <CheckCircle style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> },
        //{ label: t('fav'), action: () => { setActiveTab('favorites'); navigate('favorites'); setSettingsOpen(false); }, icon: <Star style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> },
        { label: t('account'), action: () => { navigate('account'); setSettingsOpen(false); }, icon: <User style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> },
        { label: t('contact'), action: () => { setShowContactModal(true); setSettingsOpen(false); }, icon: <Mail style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> },
        { label: t('notif'), action: () => { setActiveTab('notifications'); navigate('notifications'); setSettingsOpen(false); }, icon: <Bell style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> },
        { type: 'divider' },
        { label: t('city'), action: () => { setShowCityModal(true); setSettingsOpen(false); }, icon: <Building style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> },
        { label: t('lang'), action: () => { setShowLangModal(true); setSettingsOpen(false); }, icon: <Globe style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> },
        { label: darkMode ? t('theme_light') : t('theme_dark'), action: () => { setDarkMode(!darkMode); setSettingsOpen(false); }, icon: darkMode ? <Sun style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> : <Moon style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> },
        { type: 'divider' },
        {
            label: "Дашборд активности",
            action: () => {
                setSettingsOpen(false);
                if (window.__showDashboard) window.__showDashboard();
            },
            icon: <Activity style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} />
        },
        // Показываем "Веб-версию" только если это нативное приложение (телефон)
        ...(isNative ? [{
            label: "Веб-версия",
            action: () => {
                setSettingsOpen(false);
                window.open('https://artemasovvalera.github.io/y_s/', '_system');
            },
            icon: <Globe style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} />
        }] : []),
        { type: 'divider' },
        { label: t('search'), action: () => { setShowSearchModal(true); setSettingsOpen(false); }, icon: <Search style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> },
        { label: `Версия ${buildInfo.version} — обновить`, action: () => { setSettingsOpen(false); window.open('https://www.rustore.ru/catalog/app/com.yasam.app', '_system'); }, icon: <Download style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> }
    ];
    ;

    const handleNavigateToDetails = useCallback((route) => { 
    navigate('routeDetails', { route }); 
    // Записываем в аналитику: пользователь открыл маршрут
    logEvent('route_view', { routeName: route.name, city: currentCity });
}, [navigate, logEvent, currentCity]);

    const renderCurrentView = () => {
    if (!currentView) return null;
    if (currentView.type === 'favorites') {
    
        const currentCityFavorites = favoriteRoutes.filter(r => r.cityId === currentCity || (!r.cityId && currentCity === 'kemerovo'));
    const partnerRoute = allRoutesFlat.find(r => r.name === "Лучшее Кафе - Парадная");

    const colors = darkMode ? {
        bg: '#0A0E1A', cardBg: 'rgba(30, 41, 59, 0.8)', border: 'rgba(255,255,255,0.08)',
        text: '#F1F5F9', textSecondary: '#94A3B8', textMuted: '#64748B',
        accent: '#10B981', accentGlow: 'rgba(16, 185, 129, 0.3)',
    } : {
        bg: '#F0F4F8', cardBg: 'rgba(255,255,255,0.95)', border: 'rgba(0,0,0,0.06)',
        text: '#0F172A', textSecondary: '#475569', textMuted: '#94A3B8',
        accent: '#10B981', accentGlow: 'rgba(16, 185, 129, 0.15)',
    };

    return (
        <div style={{
            backgroundColor: colors.bg, minHeight: '100vh',
            margin: '-1rem', padding: '0', boxSizing: 'border-box',
        }}>
            {/* HEADER с градиентом */}
            <div style={{
                background: darkMode 
                    ? 'linear-gradient(135deg, #7C2D12 0%, #0A0E1A 60%)' 
                    : 'linear-gradient(135deg, #FEF3C7 0%, #F0F4F8 60%)',
                padding: '50px 24px 32px 24px',
                borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: darkMode ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.08)' }} />
                <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: darkMode ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.1)' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <button onClick={goBack} style={{
                        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                        border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: colors.text, cursor: 'pointer', marginBottom: '16px',
                    }}>
                        <ArrowLeft size={20} />
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #EF4444, #F59E0B)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '28px', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
                        }}>
                            ❤️
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: colors.accent, fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px', textTransform: 'uppercase', margin: 0 }}>
                                {t('fav')}
                            </p>
                            <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '0', letterSpacing: '-0.5px', lineHeight: 1.1, color: colors.text }}>
                                {currentCityFavorites.length > 0 
                                    ? `${currentCityFavorites.length} ${currentCityFavorites.length === 1 ? 'место' : currentCityFavorites.length < 5 ? 'места' : 'мест'}`
                                    : t('empty_list')
                                }
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* СПИСОК ИЗБРАННОГО */}
            <div style={{ padding: '20px 20px 0 20px' }}>
                {currentCityFavorites.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                        {currentCityFavorites.map((route, idx) => (
                            <div key={route.name} onClick={() => handleNavigateToDetails(route)} style={{
                                background: colors.cardBg, borderRadius: '16px',
                                border: `1px solid ${colors.border}`, overflow: 'hidden',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '0', backdropFilter: 'blur(20px)', cursor: 'pointer',
                            }}>
                                {route.image ? (
                                    <img src={route.image} alt={route.name} style={{
                                        width: '76px', height: '76px', objectFit: 'cover',
                                        flexShrink: 0, borderRadius: '16px 0 0 16px',
                                    }} />
                                ) : (
                                    <div style={{
                                        width: '76px', height: '76px', flexShrink: 0,
                                        background: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '28px', borderRadius: '16px 0 0 16px',
                                    }}>
                                        ❤️
                                    </div>
                                )}
                                <div style={{ flex: 1, padding: '12px 4px 12px 0', minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: 700, fontSize: '14px', lineHeight: 1.3,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        color: colors.text,
                                    }}>
                                        {route.name}
                                    </div>
                                    {route.subCategory && (
                                        <div style={{ fontSize: '11px', color: colors.accent, fontWeight: 600, marginTop: '2px' }}>
                                            {t(route.subCategory) || route.subCategory}
                                        </div>
                                    )}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        marginTop: '4px', fontSize: '12px', color: colors.textMuted,
                                    }}>
                                        {route.distance && (
                                            <span style={{ fontWeight: 600 }}>📏 {route.distance} {t('dist')}</span>
                                        )}
                                        {route.time && (
                                            <span>🕐 {route.time}</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px', flexShrink: 0 }}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(route); }} style={{
                                        background: 'none', border: 'none', padding: '6px',
                                        cursor: 'pointer', color: '#EF4444',
                                    }}>
                                        <Heart size={20} fill="#EF4444" />
                                    </button>
                                    <div style={{ color: colors.accent, fontSize: '16px', fontWeight: 700 }}>→</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        padding: '40px 24px', textAlign: 'center',
                        background: colors.cardBg, borderRadius: '20px',
                        border: `1px solid ${colors.border}`, marginBottom: '28px',
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>💫</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: colors.text, marginBottom: '4px' }}>
                            {t('empty_list')}
                        </div>
                        <div style={{ fontSize: '13px', color: colors.textMuted }}>
                            Добавляйте маршруты нажатием ❤️
                        </div>
                    </div>
                )}

                {/* === НАШИ ПАРТНЁРЫ === */}
                <div style={{ marginBottom: '100px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px',
                        }}>
                            🤝
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: colors.text }}>
                            Наши партнёры
                        </h3>
                    </div>

                    {partnerRoute && (
                        <div onClick={() => handleNavigateToDetails(partnerRoute)} style={{
                            background: colors.cardBg, borderRadius: '20px',
                            border: `1px solid ${colors.border}`, overflow: 'hidden',
                            cursor: 'pointer', backdropFilter: 'blur(20px)',
                            boxShadow: darkMode 
                                ? '0 8px 32px rgba(245, 158, 11, 0.1)' 
                                : '0 8px 32px rgba(245, 158, 11, 0.15)',
                        }}>
                            {/* Картинка */}
                            <div style={{ position: 'relative', width: '100%', height: '160px' }}>
                                <img src={partnerRoute.image} alt={partnerRoute.name} style={{
                                    width: '100%', height: '100%', objectFit: 'cover',
                                }} />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                                }} />
                                <div style={{
                                    position: 'absolute', top: '12px', left: '12px',
                                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                    padding: '4px 12px', borderRadius: '20px',
                                    fontSize: '11px', fontWeight: 800, color: 'white',
                                    letterSpacing: '0.5px', textTransform: 'uppercase',
                                }}>
                                    ⭐ Партнёр
                                </div>
                            </div>

                            {/* Инфо */}
                            <div style={{ padding: '16px 18px' }}>
                                <div style={{
                                    fontWeight: 800, fontSize: '17px', lineHeight: 1.3,
                                    color: colors.text, marginBottom: '6px',
                                }}>
                                    {partnerRoute.name}
                                </div>
                                <div style={{
                                    fontSize: '13px', color: colors.textMuted,
                                    lineHeight: 1.5, marginBottom: '12px',
                                }}>
                                    {partnerRoute.descriptionShort}
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        fontSize: '12px', color: colors.textMuted,
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            ☕ Кофейня
                                        </span>
                                        {partnerRoute.time && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                🕐 {partnerRoute.time}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #10B981, #059669)',
                                        padding: '8px 16px', borderRadius: '12px',
                                        fontSize: '13px', fontWeight: 700, color: 'white',
                                    }}>
                                        Перейти →
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!partnerRoute && (
                        <div style={{
                            padding: '20px', textAlign: 'center',
                            background: colors.cardBg, borderRadius: '16px',
                            border: `1px solid ${colors.border}`,
                            fontSize: '13px', color: colors.textMuted,
                        }}>
                            Партнёры скоро появятся
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
    if (currentView.type === 'routeDetails') {
        return <RouteDetailsPage route={currentView.route} darkMode={darkMode} isFavorite={isRouteInFavorites(currentView.route)} isCompleted={completedRoutes.some(c => c.name === currentView.route.name)} onBack={goBack} onPlayAudio={playAudio} onToggleFavorite={toggleFavorite} onMarkCompleted={handleRouteCompletionGlobal} lang={currentLang} />;
    }
   if (currentView.type === 'account') {
  return <AccountPage account={account} onBack={goBack} darkMode={darkMode} setAccount={setAccount} lang={currentLang} completedRoutes={completedRoutes} favoriteRoutes={favoriteRoutes} navigate={navigate} isGuest={isGuest} currentUserHash={currentUserHash} />;
}
    if (currentView.type === 'progress') {
        return (<div> <CatalogHeader title={t('completed')} onBack={goBack} darkMode={darkMode} /> {completedRoutes.length > 0 ? (<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}> {completedRoutes.map((route, idx) => (<RouteListItem key={`comp-${idx}`} route={route} onNavigate={handleNavigateToDetails} onPlayAudio={playAudio} onToggleFavorite={toggleFavorite} isFavorite={isRouteInFavorites(route)} isCompleted={true} userLocation={userLocation} formatDistance={formatDistance} C={C} subtitle={`${t('visited')}: ${route.date}`} lang={currentLang} />))} </div>) : (<div style={{ ...cardStyle, backgroundColor: C.cardBg, borderColor: C.cardBorder, ...S.textCenter, padding: '2rem' }}> <p style={{ color: C.text }}>{t('empty_list')}</p> </div>)} </div>);
    }
    if (currentView.type === 'notifications') { 
        return (<div> <CatalogHeader title={t('notif')} onBack={goBack} darkMode={darkMode} /> <div style={{ ...cardStyle, backgroundColor: C.cardBg, borderColor: C.cardBorder, ...S.textCenter, padding: '3rem 1rem' }}> <p style={{ color: C.text, fontWeight: 600 }}>{appNotifications.length > 0 ? appNotifications[0].text : t('empty_list')}</p> </div> </div>); 
    }

    switch (activeTab) {
            case 'catalog': {
            const catalogTitle = currentView.type === 'subCategories' ? t(currentView.category) : currentView.type === 'subRoutes' ? t(currentView.subCategory) : t('cat');
            
            const catColors = darkMode ? {
                bg: '#0A0E1A', cardBg: 'rgba(30, 41, 59, 0.8)', border: 'rgba(255,255,255,0.08)',
                text: '#F1F5F9', textSecondary: '#94A3B8', textMuted: '#64748B',
                accent: '#10B981',
            } : {
                bg: '#F0F4F8', cardBg: 'rgba(255,255,255,0.95)', border: 'rgba(0,0,0,0.06)',
                text: '#0F172A', textSecondary: '#475569', textMuted: '#94A3B8',
                accent: '#10B981',
            };

            const catEmojis = {
                "Культурные и исторические маршруты": "🏛️",
                "Природные и активные маршруты": "🌿",
                "Современные и урбанистические маршруты": "🏙️",
                "Гастрономические маршруты": "🍽️",
                "Семейные маршруты": "👨‍👩‍👧",
                "Альтернативные маршруты": "🔮",
                "Тематические маршруты": "🎭",
            };

            return (
                <div style={{ margin: '-1rem', padding: '0', backgroundColor: catColors.bg, minHeight: '100vh' }}>
                    
                    {/* HEADER */}
                    <div style={{
                        background: darkMode
                            ? 'linear-gradient(135deg, #1E3A5F 0%, #0A0E1A 60%)'
                            : 'linear-gradient(135deg, #DBEAFE 0%, #F0F4F8 60%)',
                        padding: currentView.type !== 'categories' ? '50px 24px 28px 24px' : '50px 24px 32px 24px',
                        borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: '-40px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: darkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)' }} />
                        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: darkMode ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.1)' }} />
                        
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            {currentView.type !== 'categories' && (
                                <button onClick={goBack} style={{
                                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                                    border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: catColors.text, cursor: 'pointer', marginBottom: '12px',
                                }}>
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '16px',
                                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '24px', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                                }}>
                                    {currentView.type === 'categories' ? '📚' : currentView.type === 'subCategories' ? (catEmojis[currentView.category] || '📂') : '📍'}
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: catColors.accent, fontWeight: 700, letterSpacing: '0.5px', margin: '0 0 2px 0', textTransform: 'uppercase' }}>
                                        {t('cat')}
                                    </p>
                                    <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: catColors.text, lineHeight: 1.1 }}>
                                        {catalogTitle}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* КОНТЕНТ */}
                    <div style={{ padding: '20px 20px 100px 20px' }}>

                        {/* КАТЕГОРИИ */}
                        {currentView.type === 'categories' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {Object.keys(CATALOG_STRUCTURE).map(key => {
                                    const categoryData = activeRoutes[key];
                                    const isActive = categoryData && isCategoryActive(categoryData);
                                    const routeCount = isActive ? Object.values(categoryData).flat().length : 0;
                                    return (
                                        <div key={key} onClick={() => isActive && navigate('subCategories', { category: key })} style={{
                                            background: catColors.cardBg, borderRadius: '16px',
                                            border: `1px solid ${catColors.border}`,
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            padding: '16px', cursor: isActive ? 'pointer' : 'default',
                                            opacity: isActive ? 1 : 0.4,
                                            backdropFilter: 'blur(20px)',
                                        }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '14px',
                                                background: darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '22px', flexShrink: 0,
                                            }}>
                                                {catEmojis[key] || '📂'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: '15px', color: catColors.text }}>
                                                    {t(key)}
                                                </div>
                                                {isActive && (
                                                    <div style={{ fontSize: '12px', color: catColors.textMuted, marginTop: '2px' }}>
                                                        {routeCount} маршрутов
                                                    </div>
                                                )}
                                            </div>
                                            {isActive && (
                                                <div style={{ color: catColors.accent, fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>→</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ПОДКАТЕГОРИИ */}
                        {currentView.type === 'subCategories' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {CATALOG_STRUCTURE[currentView.category].map(subCatKey => {
                                    const routesInSubCat = activeRoutes[currentView.category]?.[subCatKey] || [];
                                    const isActive = routesInSubCat.length > 0;
                                    const style = getCategoryStyle(subCatKey);
                                    return (
                                        <div key={subCatKey} onClick={() => isActive && navigate('subRoutes', { category: currentView.category, subCategory: subCatKey })} style={{
                                            background: catColors.cardBg, borderRadius: '16px',
                                            border: `1px solid ${catColors.border}`,
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            padding: '14px 16px', cursor: isActive ? 'pointer' : 'default',
                                            opacity: isActive ? 1 : 0.4,
                                            backdropFilter: 'blur(20px)',
                                        }}>
                                            <div style={{
                                                width: '42px', height: '42px', borderRadius: '12px',
                                                background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                {style.iconComp}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: '14px', color: catColors.text }}>
                                                    {t(subCatKey)}
                                                </div>
                                                {isActive && (
                                                    <div style={{ fontSize: '11px', color: catColors.textMuted, marginTop: '2px' }}>
                                                        {routesInSubCat.length} маршрутов
                                                    </div>
                                                )}
                                            </div>
                                            {isActive && (
                                                <div style={{ color: catColors.accent, fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>→</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* МАРШРУТЫ В ПОДКАТЕГОРИИ */}
                        {currentView.type === 'subRoutes' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(activeRoutes[currentView.category]?.[currentView.subCategory] || []).map((route) => (
                                    <div key={route.name} onClick={() => handleNavigateToDetails(route)} style={{
                                        background: catColors.cardBg, borderRadius: '16px',
                                        border: `1px solid ${catColors.border}`, overflow: 'hidden',
                                        display: 'flex', alignItems: 'center',
                                        cursor: 'pointer', backdropFilter: 'blur(20px)',
                                    }}>
                                        {route.image && (
                                            <img src={route.image} alt={route.name} style={{ width: '80px', height: '80px', objectFit: 'cover', flexShrink: 0, borderRadius: '16px 0 0 16px' }} />
                                        )}
                                        <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: catColors.text }}>
                                                {route.name}
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '12px', color: catColors.textMuted }}>
                                                {route.distance && <span>📏 {route.distance} {t('dist')}</span>}
                                                {route.time && <span>🕐 {route.time}</span>}
                                                {route.audioUrl && <span>🎧</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '14px', flexShrink: 0 }}>
                                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(route); }} style={{
                                                background: 'none', border: 'none', padding: '6px', cursor: 'pointer',
                                                color: isRouteInFavorites(route) ? '#EF4444' : catColors.textMuted,
                                            }}>
                                                <Heart size={18} fill={isRouteInFavorites(route) ? '#EF4444' : 'none'} />
                                            </button>
                                            <div style={{ color: catColors.accent, fontSize: '16px', fontWeight: 700 }}>→</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        
  case 'recommendations': {
    const cityName = t('city_' + currentCity) || CITIES.find(c => c.id === currentCity)?.name || "City";
    
    const recColors = darkMode ? {
        bg: '#0A0E1A', cardBg: 'rgba(30, 41, 59, 0.8)', border: 'rgba(255,255,255,0.08)',
        text: '#F1F5F9', textSecondary: '#94A3B8', textMuted: '#64748B',
        accent: '#10B981', accentGlow: 'rgba(16, 185, 129, 0.3)',
    } : {
        bg: '#F0F4F8', cardBg: 'rgba(255,255,255,0.95)', border: 'rgba(0,0,0,0.06)',
        text: '#0F172A', textSecondary: '#475569', textMuted: '#94A3B8',
        accent: '#10B981', accentGlow: 'rgba(16, 185, 129, 0.15)',
    };

   const partnerRouteRec = allRoutesFlat.find(r => r.name === "Лучшее Кафе - Парадная");

    return (
        <div style={{ margin: '-1rem', padding: '0', backgroundColor: recColors.bg, minHeight: '100vh' }}>
            
            {/* HEADER с градиентом — как на дашборде */}
            <div style={{
                background: darkMode
                    ? 'linear-gradient(135deg, #064E3B 0%, #0A0E1A 60%)'
                    : 'linear-gradient(135deg, #D1FAE5 0%, #F0F4F8 60%)',
                padding: '50px 24px 32px 24px',
                borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Декоративные круги */}
                <div style={{ position: 'absolute', top: '-40px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: darkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)' }} />
                <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: darkMode ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.1)' }} />

               <div style={{ position: 'relative', zIndex: 1 }}>
  <p style={{ fontSize: '14px', color: recColors.accent, fontWeight: 700, letterSpacing: '0.5px', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
    {t('app_name')} 🗺️
  </p>
  
  {/* КНОПКА ВЫБОРА ГОРОДА */}
  <button 
    onClick={() => setShowCityModal(true)}
    style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
      border: `1px solid ${recColors.border}`,
      borderRadius: '12px', padding: '8px 16px',
      cursor: 'pointer', backdropFilter: 'blur(10px)',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)'}
    onMouseLeave={(e) => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'}
  >
    <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0', letterSpacing: '-0.5px', lineHeight: 1.1, color: recColors.text }}>
      {cityName}
    </h1>
    <ChevronDown size={20} color={recColors.text} style={{ opacity: 0.7 }} />
  </button>
</div>
            </div>

            {/* КОНТЕНТ */}
            <div style={{ padding: '20px 20px 120px 20px' }}>

                {/* 1. РЯДОМ С ВАМИ */}
                {nearbyRoutesForHome.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📍</div>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: recColors.text }}>{t('near')}</h2>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                            {nearbyRoutesForHome.map((route, idx) => (
                                <div key={`rec-${idx}`} onClick={() => handleNavigateToDetails(route)} style={{
                                    minWidth: '120px', height: '150px', borderRadius: '20px',
                                    position: 'relative', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                }}>
                                    <img src={route.image} alt={route.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)' }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
                                        <div style={{ color: '#10B981', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                            {t(route.subCategory) || route.subCategory}
                                        </div>
                                        <div style={{ color: 'white', fontWeight: 700, fontSize: '13px', lineHeight: 1.2, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {route.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ background: 'rgba(16, 185, 129, 0.3)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: '20px', fontSize: '10px', color: 'white', fontWeight: 600 }}>
                                                👣 {Math.floor(route.distance * 1250)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

{/* 2. РЕКОМЕНДУЕМ (КРУПНЫЕ КАРТОЧКИ КАК В "РЯДОМ С ВАМИ") */}
{recommendedCurated.length > 0 && (
  <div style={{ marginBottom: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>⭐</div>
      <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: recColors.text }}>Рекомендуем</h2>
    </div>
    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
      {recommendedCurated.map((route, idx) => (
        <div key={`rec-large-${idx}`} onClick={() => handleNavigateToDetails(route)} style={{
          minWidth: '240px', height: '200px', borderRadius: '20px',
          position: 'relative', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          <img src={route.image} alt={route.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
            <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
              {t(route.subCategory) || route.subCategory}
            </div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '13px', lineHeight: 1.2, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {route.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.3)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: '20px', fontSize: '10px', color: 'white', fontWeight: 600 }}>
                👣 {Math.floor(route.distance * 1250)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

                {/* 3. ИССЛЕДУЙ */}
                {exploreCurated.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🔍</div>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: recColors.text }}>Исследуй</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {exploreCurated.map((route, idx) => (
                                <div key={`explore-${idx}`} onClick={() => handleNavigateToDetails(route)} style={{
                                    background: recColors.cardBg, borderRadius: '16px',
                                    border: `1px solid ${recColors.border}`, overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', gap: '0',
                                    cursor: 'pointer', backdropFilter: 'blur(20px)',
                                }}>
                                    {route.image && (
                                        <img src={route.image} alt={route.name} style={{ width: '80px', height: '80px', objectFit: 'cover', flexShrink: 0, borderRadius: '16px 0 0 16px' }} />
                                    )}
                                    <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: recColors.text }}>
                                            {route.name}
                                        </div>
                                        {route.subCategory && (
                                            <div style={{ fontSize: '11px', color: recColors.accent, fontWeight: 600, marginTop: '2px' }}>
                                                {t(route.subCategory) || route.subCategory}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '12px', color: recColors.textMuted }}>
                                            {route.distance && <span>📏 {route.distance} км</span>}
                                            {route.time && <span>🕐 {route.time}</span>}
                                        </div>
                                    </div>
                                    <div style={{ paddingRight: '14px', color: recColors.accent, fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>→</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

{/* 4. ИНТЕРЕСНОЕ */}
{interestingCurated.length > 0 && (
  <div style={{ marginBottom: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎯</div>
      <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: recColors.text }}>Интересное</h2>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {interestingCurated.map((route, idx) => (
        <div key={`interesting-${idx}`} onClick={() => handleNavigateToDetails(route)} style={{
          background: recColors.cardBg, borderRadius: '16px',
          border: `1px solid ${recColors.border}`, overflow: 'hidden',
          display: 'flex', alignItems: 'center', cursor: 'pointer', backdropFilter: 'blur(20px)',
        }}>
          {route.image && (
            <img src={route.image} alt={route.name} style={{ width: '80px', height: '80px', objectFit: 'cover', flexShrink: 0, borderRadius: '16px 0 0 16px' }} />
          )}
          <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: recColors.text }}>
              {route.name}
            </div>
            {route.subCategory && (
              <div style={{ fontSize: '11px', color: recColors.accent, fontWeight: 600, marginTop: '2px' }}>
                {t(route.subCategory) || route.subCategory}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '12px', color: recColors.textMuted }}>
              {route.distance && <span>📏 {route.distance} км</span>}
              {route.time && <span>🕐 {route.time}</span>}
            </div>
          </div>
          <div style={{ paddingRight: '14px', color: recColors.accent, fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>→</div>
        </div>
      ))}
    </div>
  </div>
)}
        </div>
      </div>
    );
  }
case 'favorites': {
    const currentCityFavorites = favoriteRoutes.filter(r => r.cityId === currentCity || (!r.cityId && currentCity === 'kemerovo'));
   const partnerRoute2 = allRoutesFlat.find(r => r.name === "Лучшее Кафе - Парадная");

    const colors2 = darkMode ? {
        bg: '#0A0E1A', cardBg: 'rgba(30, 41, 59, 0.8)', border: 'rgba(255,255,255,0.08)',
        text: '#F1F5F9', textSecondary: '#94A3B8', textMuted: '#64748B',
        accent: '#10B981',
    } : {
        bg: '#F0F4F8', cardBg: 'rgba(255,255,255,0.95)', border: 'rgba(0,0,0,0.06)',
        text: '#0F172A', textSecondary: '#475569', textMuted: '#94A3B8',
        accent: '#10B981',
    };

    return (
        <div style={{
            backgroundColor: colors2.bg, minHeight: '100vh',
            margin: '-1rem', padding: '0',
        }}>
            <div style={{
                background: darkMode 
                    ? 'linear-gradient(135deg, #7C2D12 0%, #0A0E1A 60%)' 
                    : 'linear-gradient(135deg, #FEF3C7 0%, #F0F4F8 60%)',
                padding: '50px 24px 32px 24px',
                borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.08)' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #EF4444, #F59E0B)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '28px', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
                        }}>❤️</div>
                        <div>
                            <p style={{ fontSize: '14px', color: colors2.accent, fontWeight: 700, letterSpacing: '0.5px', margin: '0 0 2px 0', textTransform: 'uppercase' }}>{t('fav')}</p>
                            <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0, color: colors2.text }}>
                                {currentCityFavorites.length > 0 
                                    ? `${currentCityFavorites.length} ${currentCityFavorites.length === 1 ? 'место' : currentCityFavorites.length < 5 ? 'места' : 'мест'}`
                                    : t('empty_list')
                                }
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '20px 20px 0 20px' }}>
                {currentCityFavorites.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                        {currentCityFavorites.map((route) => (
                            <div key={route.name} onClick={() => handleNavigateToDetails(route)} style={{
                                background: colors2.cardBg, borderRadius: '16px',
                                border: `1px solid ${colors2.border}`, overflow: 'hidden',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '0', cursor: 'pointer',
                            }}>
                                {route.image ? (
                                    <img src={route.image} alt={route.name} style={{ width: '76px', height: '76px', objectFit: 'cover', flexShrink: 0, borderRadius: '16px 0 0 16px' }} />
                                ) : (
                                    <div style={{ width: '76px', height: '76px', flexShrink: 0, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', borderRadius: '16px 0 0 16px' }}>❤️</div>
                                )}
                                <div style={{ flex: 1, padding: '12px 4px 12px 0', minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors2.text }}>{route.name}</div>
                                    {route.subCategory && <div style={{ fontSize: '11px', color: colors2.accent, fontWeight: 600, marginTop: '2px' }}>{t(route.subCategory) || route.subCategory}</div>}
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '12px', color: colors2.textMuted }}>
                                        {route.distance && <span>📏 {route.distance} {t('dist')}</span>}
                                        {route.time && <span>🕐 {route.time}</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px', flexShrink: 0 }}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(route); }} style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: '#EF4444' }}><Heart size={20} fill="#EF4444" /></button>
                                    <div style={{ color: colors2.accent, fontSize: '16px', fontWeight: 700 }}>→</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '40px 24px', textAlign: 'center', background: colors2.cardBg, borderRadius: '20px', border: `1px solid ${colors2.border}`, marginBottom: '28px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>💫</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: colors2.text }}>{t('empty_list')}</div>
                        <div style={{ fontSize: '13px', color: colors2.textMuted, marginTop: '4px' }}>Добавляйте маршруты нажатием ❤️</div>
                    </div>
                )}

                {/* НАШИ ПАРТНЁРЫ */}
                <div style={{ marginBottom: '100px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤝</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: colors2.text }}>Наши партнёры</h3>
                    </div>
                    {partnerRoute2 && (
                        <div onClick={() => handleNavigateToDetails(partnerRoute2)} style={{
                            background: colors2.cardBg, borderRadius: '20px', border: `1px solid ${colors2.border}`,
                            overflow: 'hidden', cursor: 'pointer',
                            boxShadow: darkMode ? '0 8px 32px rgba(245, 158, 11, 0.1)' : '0 8px 32px rgba(245, 158, 11, 0.15)',
                        }}>
                            <div style={{ position: 'relative', width: '100%', height: '160px' }}>
                                <img src={partnerRoute2.image} alt={partnerRoute2.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
                                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>⭐ Партнёр</div>
                            </div>
                            <div style={{ padding: '16px 18px' }}>
                                <div style={{ fontWeight: 800, fontSize: '17px', color: colors2.text, marginBottom: '6px' }}>{partnerRoute2.name}</div>
                                <div style={{ fontSize: '13px', color: colors2.textMuted, lineHeight: 1.5, marginBottom: '12px' }}>{partnerRoute2.descriptionShort}</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: colors2.textMuted }}>
                                        <span>☕ Кофейня</span>
                                        {partnerRoute2.time && <span>🕐 {partnerRoute2.time}</span>}
                                    </div>
                                    <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: 'white' }}>Перейти →</div>
                                </div>
                            </div>
                        </div>
                    )}
                    {!partnerRoute2 && (
                        <div style={{ padding: '20px', textAlign: 'center', background: colors2.cardBg, borderRadius: '16px', border: `1px solid ${colors2.border}`, fontSize: '13px', color: colors2.textMuted }}>
                            Партнёры скоро появятся
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
        
        case 'map': { 
            const center = CITIES.find(c => c.id === currentCity); 
            return (<div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}> <MapPage userLocation={userLocation} allRoutes={allRoutesFlat} completedRoutes={completedRoutes} onNavigate={handleNavigateToDetails} darkMode={darkMode} centerCity={center} /> </div>); 
        }
        
        default: 
            return null;
    }
};
    const isMapTab = activeTab === 'map';
    const containerStyle = isMapTab ? { width: '100%', height: '100dvh', backgroundColor: C.bg, overflow: 'hidden' } : { width: '100%', padding: '1rem 1rem calc(5.5rem + env(safe-area-inset-bottom, 0px)) 1rem', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', backgroundColor: C.bg, color: C.text, boxSizing: 'border-box', overflowY: 'auto', minHeight: '100dvh' };

    return (<> <div style={containerStyle}>
        {!isMapTab && (<div ref={settingsRef} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)', right: '1rem', zIndex: 110 }}> <button onClick={() => setSettingsOpen(!settingsOpen)} style={{ cursor: 'pointer', padding: '0.5rem', borderRadius: '9999px', color: C.textMuted, backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, position: 'relative' }}> <Settings style={{ width: '1.25rem', height: '1.25rem', color: C.text }} /> </button> {settingsOpen && (<div style={{ position: 'absolute', top: '3rem', right: 0, width: '16rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', borderRadius: '1rem', padding: '0.5rem', zIndex: 20, border: `1px solid ${C.cardBorder}`, backgroundColor: C.cardBg }}> {settingsItems.map((item, index) => { if (item.type === 'divider') return <hr key={`div-${index}`} style={{ border: 'none', borderTop: `1px solid ${C.cardBorder}`, margin: '0.5rem 0' }} />; return <button key={item.label} onClick={item.action} style={{ width: '100%', display: 'flex', alignItems: 'center', textAlign: 'left', padding: '0.75rem', borderRadius: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: C.text, transition: 'background 0.2s' }}>{item.icon}<span>{item.label}</span></button>; })} </div>)} </div>)} {renderCurrentView()} </div>
        <Modal show={showModal} message={modalMessage} onClose={() => setShowModal(false)} darkMode={darkMode} lang={currentLang} />
       <CountryCityModal   show={showCityModal}   onClose={() => setShowCityModal(false)}    onSelectCity={setCurrentCity}    currentCityId={currentCity}    darkMode={darkMode}    lang={currentLang} />
        <SelectionModal show={showLangModal} onClose={() => setShowLangModal(false)} title={t('lang')} items={LANGUAGES} onSelect={setCurrentLang} currentId={currentLang} darkMode={darkMode} lang={currentLang} />
        <SearchModal show={showSearchModal} onClose={() => setShowSearchModal(false)} onNavigate={navigate} allRoutes={uniqueAllRoutes} darkMode={darkMode} lang={currentLang} />
        {currentPlayingRoute && <MiniAudioPlayer route={currentPlayingRoute} onClose={stopAudio} darkMode={darkMode} ref={audioPlayerRef} onAudioError={() => { stopAudio(); setModalMessage(t('audio_error')); setShowModal(true); }} />} 
            <LiquidMenu activeTab={activeTab} onTabChange={handleTabChange} onSearchClick={() => setShowSearchModal(true)} darkMode={darkMode} lang={currentLang} />     </>);
}

const LoadingScreen = ({ darkMode, onComplete }) => {
    const [showHint, setShowHint] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    useEffect(() => {
        // Показываем подсказку через 2 секунды
        const timer = setTimeout(() => setShowHint(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    // Предзагрузка изображения
    useEffect(() => {
        const img = new Image();
        img.onload = () => setImageLoaded(true);
        img.onerror = () => setImageError(true);
        img.src = 'https://archive.org/download/logo_20260223/logo.jpg';
    }, []);

    // Клик по экрану = переход
    const handleScreenClick = () => {
        if (showHint && onComplete) {
            onComplete();
        }
    };

    const letters = ['Я', ' ', 'С', 'А', 'М'];
    const C = darkMode ? S.dark : S.light;

    return (
        <div 
            onClick={handleScreenClick}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: C.bg,
                backgroundImage: imageLoaded && !imageError 
                    ? 'url(https://archive.org/download/logo_20260223/logo.jpg)' 
                    : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                cursor: showHint ? 'pointer' : 'default',
            }}
        >
            {/* Затемняющий оверлей */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: imageLoaded && !imageError
                    ? 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5))'
                    : 'transparent',
            }} />

            {/* Плывущие буквы "Я САМ" — менее прозрачные */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
            }}>
                {letters.map((letter, i) => (
                    <span 
                        key={i}
                        style={{
                            fontSize: letter === ' ' ? '0.5rem' : '5rem',
                            fontWeight: 900,
                            color: imageLoaded && !imageError 
                                ? 'rgba(255, 255, 255, 0.6)' 
                                : S.emerald600,
                            textShadow: imageLoaded && !imageError 
                                ? '0 0 60px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.3)'
                                : 'none',
                            animation: `floatLetter 3s ease-in-out infinite`,
                            animationDelay: `${i * 0.3}s`,
                            letterSpacing: '0.05em',
                        }}
                    >
                        {letter === ' ' ? '' : letter}
                    </span>
                ))}
            </div>

           
            {/* CSS анимации */}
            <style>{`
                @keyframes floatLetter {
                    0%, 100% { 
                        transform: translateY(0) scale(1); 
                        opacity: 0.5;
                    }
                    50% { 
                        transform: translateY(-20px) scale(1.03); 
                        opacity: 0.8;
                    }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }
                
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
            `}</style>
        </div>
    );
};

// ==========================================
// ЭКРАН АВТОРИЗАЦИИ
// ==========================================
const AuthScreen = ({ darkMode, onAuthSuccess, onGuestSuccess, initialMode }) => {
    const [mode, setMode] = useState('welcome'); // welcome | login | register | reset
    // Добавляем useEffect, чтобы режим обновлялся, если мы переходим из главного экрана
    useEffect(() => {
    if (initialMode) setMode(initialMode); // Добавил проверку, чтобы не было undefined
  }, [initialMode]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const C = darkMode ? S.dark : S.light;
const [showLicense, setShowLicense] = useState(false);
    const errMap = {
        'already_exists': 'Этот email уже зарегистрирован',
        'not_found': 'Пользователь не найден',
        'wrong_password': 'Неверный пароль',
        'network_error': 'Ошибка сети. Проверьте подключение',
    };

    const handleRegister = async () => {
        if (!email || !password) { setError('Заполните все поля'); return; }
        if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
        setLoading(true); setError('');
        const emailHash = await hashString(email.toLowerCase().trim());
        const passHash = await hashString(password + emailHash);
        const result = await apiCall('register', {
            email: email.toLowerCase().trim(),
            password: password,
            deviceData: { ...getDeviceData(), isGuest: false }
        });
        if (result.success) {
            localStorage.setItem('app-auth', JSON.stringify({ hash: result.hash, isGuest: false }));
            onAuthSuccess(result.hash);
        } else {
            setError(errMap[result.error] || 'Ошибка регистрации');
        }
        setLoading(false);
    };

    const handleLogin = async () => {
        if (!email || !password) { setError('Заполните все поля'); return; }
        setLoading(true); setError('');
        const result = await apiCall('login', {
            email: email.toLowerCase().trim(),
            password: password,
        });
        if (result.success) {
            localStorage.setItem('app-auth', JSON.stringify({ hash: result.hash, isGuest: false }));
            onAuthSuccess(result.hash);
        } else {
            setError(errMap[result.error] || 'Ошибка входа');
        }
        setLoading(false);
    };

    const handleReset = async () => {
        if (!email) { setError('Введите email'); return; }
        setLoading(true); setError('');
        const result = await apiCall('resetPassword', {
            email: email.toLowerCase().trim(),
            newPassword: password,
        });
        if (result.success) { setResetSent(true); }
        else { setError(errMap[result.error] || 'Ошибка сброса пароля'); }
        setLoading(false);
    };

    const handleGuest = async () => {
        setLoading(true);
        const guestHash = await hashString('guest_' + Date.now() + '_' + Math.random());
        const result = await apiCall('register', {
            email: 'guest_' + guestHash.slice(0, 8) + '@guest',
            password: guestHash,
            deviceData: { ...getDeviceData(), isGuest: true }
        });
        const hash = result.hash || guestHash;
        localStorage.setItem('app-auth', JSON.stringify({ hash, isGuest: true }));
        onGuestSuccess(hash);
        setLoading(false);
    };

    const inputStyle = {
        width: '100%', padding: '0.875rem 1rem', borderRadius: '0.875rem',
        border: `1.5px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
        color: C.text, fontSize: '1rem', boxSizing: 'border-box', outline: 'none',
        marginBottom: '0.75rem', transition: 'border 0.2s',
    };

    const btnPrimary = (disabled) => ({
        width: '100%', backgroundColor: disabled ? '#6b7280' : S.emerald600,
        color: 'white', fontWeight: 700, padding: '0.875rem', borderRadius: '0.875rem',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '1rem',
        marginBottom: '0.75rem', transition: 'all 0.2s',
        boxShadow: disabled ? 'none' : '0 4px 15px rgba(16,185,129,0.3)',
    });

    const btnSecondary = {
        width: '100%', backgroundColor: 'transparent',
        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
        fontWeight: 600, padding: '0.875rem', borderRadius: '0.875rem',
        border: `1.5px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        cursor: 'pointer', fontSize: '1rem', marginBottom: '0.75rem', transition: 'all 0.2s',
    };

    const linkStyle = {
        color: S.emerald600, cursor: 'pointer', fontSize: '0.875rem',
        textDecoration: 'none', fontWeight: 500,
    };

    // Экран приветствия
    if (mode === 'welcome') return (
        <div style={{
            minHeight: '100dvh', width: '100%', boxSizing: 'border-box',
            background: darkMode
                ? 'linear-gradient(135deg, #0A0E1A 0%, #0d1f15 50%, #0A0E1A 100%)'
                : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0f9ff 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'space-between', padding: '3rem 1.5rem 2rem',
        }}>
            {/* Верхняя часть — логотип и приветствие */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '28px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3rem', marginBottom: '1.5rem',
                    boxShadow: '0 20px 40px rgba(16,185,129,0.35)',
                }}>🗺️</div>

                <h1 style={{
                    fontSize: '3rem', fontWeight: 900, margin: '0 0 0.5rem',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px',
                }}>Я Сам!</h1>

                <p style={{
                    fontSize: '1.1rem', color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                    textAlign: 'center', maxWidth: '260px', lineHeight: 1.5, margin: '0 0 2.5rem',
                }}>Открывай города своими глазами</p>

                {/* Три фичи */}
                {[
                    { icon: '🎧', text: 'Аудиогиды для самостоятельных прогулок' },
                    { icon: '🏆', text: 'Достижения и маршруты по городам России' },
                    { icon: '📊', text: 'Следи за своей активностью' },
                ].map((item, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        marginBottom: '0.75rem', width: '100%', maxWidth: '280px',
                        padding: '0.75rem 1rem', borderRadius: '1rem',
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.875rem', color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', fontWeight: 500 }}>{item.text}</span>
                    </div>
                ))}
            </div>

            {/* Нижняя часть — кнопки */}
            <div style={{ width: '100%', maxWidth: '360px' }}>
                <button onClick={() => setMode('register')} style={btnPrimary(false)}>
                    Создать аккаунт
                </button>
                <button onClick={() => setMode('login')} style={btnSecondary}>
                    Уже есть аккаунт
                </button>
                <button onClick={handleGuest} disabled={loading} style={{
                    ...btnSecondary, marginBottom: 0,
                    color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
                    fontSize: '0.875rem', padding: '0.75rem',
                }}>
                    {loading ? 'Загрузка...' : '👤 Продолжить как гость'}
                </button>
            </div>
        </div>
    );

    // Экраны входа / регистрации / сброса
    return (
        <div style={{
            minHeight: '100dvh', width: '100%', boxSizing: 'border-box',
            background: darkMode
                ? 'linear-gradient(135deg, #0A0E1A 0%, #0d1f15 100%)'
                : 'linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '1.5rem',
        }}>
            <div style={{
                width: '100%', maxWidth: '380px',
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)',
                borderRadius: '1.5rem', padding: '2rem',
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            }}>
                {/* Заголовок */}
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {mode === 'login' ? '👋' : mode === 'register' ? '🎉' : '🔑'}
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem', color: C.text }}>
                        {mode === 'login' ? 'Добро пожаловать' : mode === 'register' ? 'Создать аккаунт' : 'Сброс пароля'}
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)', margin: 0 }}>
                        {mode === 'login' ? 'Войдите чтобы продолжить' : mode === 'register' ? 'Это займёт меньше минуты' : 'Введите новый пароль'}
                    </p>
                </div>

                {resetSent ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <p style={{ color: S.emerald600, fontWeight: 700, marginBottom: '0.5rem' }}>Пароль обновлён!</p>
                        <p style={{ fontSize: '0.875rem', color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)', marginBottom: '1.5rem' }}>
                            Теперь можете войти с новым паролем
                        </p>
                        <button onClick={() => { setMode('login'); setResetSent(false); }} style={btnPrimary(false)}>
                            Войти
                        </button>
                    </div>
                ) : (
                    <>
                        <input type="email" placeholder="Email" value={email}
                            onChange={e => { setEmail(e.target.value); setError(''); }}
                            style={inputStyle} />

                        <input type="password"
                            placeholder={mode === 'reset' ? 'Новый пароль' : 'Пароль'}
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(''); }}
                            style={inputStyle}
                            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : mode === 'register' ? handleRegister() : handleReset())} />

                        {error && (
                            <div style={{
                                color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem',
                                padding: '0.625rem 0.875rem', backgroundColor: 'rgba(239,68,68,0.08)',
                                borderRadius: '0.75rem', textAlign: 'center',
                            }}>{error}</div>
                        )}

                        <button
                            onClick={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleReset}
                            disabled={loading || !email || !password}
                            style={btnPrimary(loading || !email || !password)}>
                            {loading ? '...' : mode === 'login' ? 'Войти' : mode === 'register' ? 'Зарегистрироваться' : 'Сохранить пароль'}
                        </button>

{mode === 'register' && (
    <p style={{ fontSize: '0.75rem', textAlign: 'center', color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', marginTop: '0.5rem' }}>
        Регистрируясь, вы принимаете{' '}
        <span 
            onClick={() => setShowLicense(true)}
            style={{ color: S.emerald600, cursor: 'pointer', textDecoration: 'underline' }}>
            условия использования
        </span>
    </p>
)}

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                            {mode === 'login' && <>
                                <span style={linkStyle} onClick={() => { setMode('register'); setError(''); }}>Нет аккаунта? Зарегистрироваться</span>
                                <span style={linkStyle} onClick={() => { setMode('reset'); setError(''); }}>Забыли пароль?</span>
                            </>}
                            {mode === 'register' && (
                                <span style={linkStyle} onClick={() => { setMode('login'); setError(''); }}>Уже есть аккаунт? Войти</span>
                            )}
                            {mode === 'reset' && (
                                <span style={linkStyle} onClick={() => { setMode('login'); setError(''); }}>Вернуться ко входу</span>
                            )}
                            <span style={{ ...linkStyle, color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }}
                                onClick={() => setMode('welcome')}>← Назад</span>
                        </div>
                    </>
                )}
            </div>

{showLicense && (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
        <div style={{
            width: '100%', maxWidth: '480px',
            backgroundColor: darkMode ? S.dark.cardBg : S.light.cardBg,
            borderRadius: '1.5rem 1.5rem 0 0',
            padding: '1.5rem',
            maxHeight: '80vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: darkMode ? S.dark.text : S.light.text, margin: 0 }}>
                    Условия использования
                </h3>
                <button onClick={() => setShowLicense(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: darkMode ? S.dark.textMuted : S.light.textMuted }}>
                    ✕
                </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, fontSize: '0.875rem', color: darkMode ? S.dark.textMuted : S.light.textMuted, lineHeight: 1.6 }}>
                <p><strong>1. Общие положения</strong></p>
                <p>Используя приложение "Я Сам!", вы принимаете настоящие условия.</p>
                <p><strong>2. Контент</strong></p>
                <p>Все аудиогиды, маршруты и материалы принадлежат разработчику. Запрещено копирование и распространение без разрешения.</p>
                <p><strong>3. Ответственность</strong></p>
                <p>Разработчик не несёт ответственности за актуальность маршрутов и точность описаний.</p>
                <p><strong>4. Данные</strong></p>
                <p>Приложение собирает анонимную статистику использования для улучшения сервиса. Персональные данные не хранятся.</p>
            </div>
            <button onClick={() => setShowLicense(false)} style={{
                marginTop: '1rem', width: '100%', padding: '0.875rem',
                backgroundColor: S.emerald600, color: 'white',
                fontWeight: 700, borderRadius: '1rem', border: 'none', cursor: 'pointer',
            }}>
                Понятно
            </button>
        </div>
    </div>
)}

        </div>
    );
};


// ==========================================
// АНКЕТА
// ==========================================
const SurveyModal = ({ darkMode, onComplete, onSkip }) => {
    const C = darkMode ? S.dark : S.light;
    const [step, setStep] = useState(-1);
    const [answers, setAnswers] = useState({
        age_group: '',
        gender: '',
        city: '',
        walk_frequency: '',
        goal: ''
    });

    const questions = [
        {
            key: 'age_group',
            question: 'Ваша возрастная группа?',
            emoji: '🎂',
            options: ['18–25', '26–35', '36–45', '46–55', '55+']
        },
        {
            key: 'gender',
            question: 'Ваш пол?',
            emoji: '👤',
            options: ['Мужской', 'Женский', 'Не указан']
        },
        {
            key: 'city',
            question: 'Ваш город?',
            emoji: '🏙️',
            options: ['Кемерово', 'Новосибирск', 'Томск', 'Красноярск', 'Другой']
        },
        {
            key: 'walk_frequency',
            question: 'Как часто гуляли до установки?',
            emoji: '🚶',
            options: ['Редко', 'Иногда', 'Часто', 'Каждый день']
        },
        {
            key: 'goal',
            question: 'Цель использования приложения?',
            emoji: '🎯',
            options: ['Познакомиться с городом', 'Здоровье и активность', 'Интерес к истории', 'Другое']
        }
    ];

    const current = questions[step];

if (step === -1) return (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
    }}>
        <div style={{
            width: '100%', maxWidth: '480px',
            backgroundColor: C.cardBg,
            borderRadius: '1.5rem 1.5rem 0 0',
            padding: '2rem 1.5rem',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.2)',
        }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: C.text, margin: '0 0 0.75rem' }}>
                    Помогите нам стать лучше
                </h3>
                <p style={{ fontSize: '0.9375rem', color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', lineHeight: 1.6, margin: 0 }}>
                    Ответьте на 5 коротких вопросов — это поможет нам улучшить приложение и сделать маршруты интереснее именно для вас. Займёт меньше минуты.
                </p>
            </div>
            <button onClick={() => setStep(0)} style={{
                width: '100%', backgroundColor: S.emerald600, color: 'white',
                fontWeight: 700, padding: '0.875rem', borderRadius: '1rem',
                border: 'none', cursor: 'pointer', fontSize: '1rem',
                marginBottom: '0.75rem',
                boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
            }}>
                Начать опрос
            </button>
            <button onClick={onSkip} style={{
                width: '100%', padding: '0.75rem', borderRadius: '1rem',
                border: 'none', backgroundColor: 'transparent',
                color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontSize: '0.875rem', cursor: 'pointer',
            }}>
                Пропустить — вернусь позже
            </button>
        </div>
    </div>
);

    const totalAnswered = Object.values(answers).filter(v => v !== '').length;

    const handleSelect = (value) => {
        const newAnswers = { ...answers, [current.key]: value };
        setAnswers(newAnswers);
        if (step < questions.length - 1) {
            setTimeout(() => setStep(step + 1), 300);
        } else {
            onComplete(newAnswers);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                width: '100%', maxWidth: '480px',
                backgroundColor: C.cardBg,
                borderRadius: '1.5rem 1.5rem 0 0',
                padding: '1.5rem',
                boxShadow: '0 -20px 60px rgba(0,0,0,0.2)',
            }}>
                {/* Прогресс */}
                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}>
                    {questions.map((_, i) => (
                        <div key={i} style={{
                            flex: 1, height: '4px', borderRadius: '2px',
                            backgroundColor: i <= step ? S.emerald600 : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                            transition: 'background 0.3s',
                        }} />
                    ))}
                </div>

                {/* Вопрос */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{current.emoji}</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text, margin: 0 }}>
                        {current.question}
                    </h3>
                </div>

                {/* Варианты */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
                    {current.options.map((option) => (
                        <button key={option} onClick={() => handleSelect(option)} style={{
                            padding: '0.875rem 1rem', borderRadius: '1rem',
                            border: `1.5px solid ${answers[current.key] === option ? S.emerald600 : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                            backgroundColor: answers[current.key] === option
                                ? 'rgba(16,185,129,0.1)'
                                : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'),
                            color: C.text, fontSize: '1rem', fontWeight: 500,
                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        }}>
                            {option}
                        </button>
                    ))}
                </div>

                {/* Кнопка пропустить */}
                <button onClick={onSkip} style={{
                    width: '100%', padding: '0.75rem', borderRadius: '1rem',
                    border: 'none', backgroundColor: 'transparent',
                    color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                    fontSize: '0.875rem', cursor: 'pointer',
                }}>
                    Пропустить — вернусь позже
                </button>
            </div>
        </div>
    );
};

const AgreementScreen = ({ onAccept, darkMode }) => {
    const [isChecked, setIsChecked] = useState(false);
    const C = darkMode ? S.dark : S.light;
    return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem', backgroundColor: C.bg, color: C.text, boxSizing: 'border-box' }}> <div style={{ padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', width: '100%', maxWidth: '30rem', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}> <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>Лицензионное соглашение</h2> <div style={{ height: '50vh', overflowY: 'auto', border: `1px solid ${C.cardBorder}`, padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}> <p><strong>1. Общие положения</strong></p><p>1.1. Используя Приложение, вы принимаете условия настоящего Соглашения.</p> <p><strong>2. Геолокация и Уведомления</strong></p><p>2.1. Приложение использует данные о вашем местоположении для уведомления о близости достопримечательностей (в радиусе 20 метров).</p><p>2.2. Данные обрабатываются локально на устройстве.</p><p>2.3. Приложение может отправлять уведомления об обновлениях и интересных местах.</p> <p><strong>3. Ответственность</strong></p><p>3.1. Разработчик не несет ответственности за актуальность маршрутов.</p> </div> <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}> <input type="checkbox" id="agreement-checkbox" checked={isChecked} onChange={() => setIsChecked(!isChecked)} style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} /> <label htmlFor="agreement-checkbox" style={{ fontSize: '0.875rem' }}>Я принимаю условия соглашения и политику конфиденциальности.</label> </div> <button onClick={onAccept} disabled={!isChecked} style={{ width: '100%', backgroundColor: S.emerald600, color: 'white', fontWeight: 600, padding: '0.75rem 0', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: isChecked ? 1 : 0.5, transition: 'opacity 0.2s' }}>Принять и продолжить</button> </div> </div>);
};
export default function App() {
    
    // Добавьте рядом с другими useState
const [authInitialMode, setAuthInitialMode] = useState('welcome');

// Добавьте функцию перехода к регистрации
const handleGoToRegister = () => {
    setAuthInitialMode('register');
    setPhase('auth');
     }; 
    const [phase, setPhase] = useState(() => {
  try {
    const auth = localStorage.getItem('app-auth');
    if (!auth) return 'mainApp';
    return 'mainApp';
  } catch {
    return 'mainApp';
  }
});

const [currentUserHash, setCurrentUserHash] = useState(() => {
    try {
        const auth = localStorage.getItem('app-auth');
        return auth ? JSON.parse(auth).hash : null;
    } catch { return null; }
});

const [isGuest, setIsGuest] = useState(() => {
    try {
        const auth = localStorage.getItem('app-auth');
        if (!auth) return true;
        return auth ? JSON.parse(auth).isGuest : false;
    } catch { return true; }
});
    const [showDashboard, setShowDashboard] = useState(false);
    
    const loadFromStorage = (key, defaultValue) => { 
        try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : defaultValue; } 
        catch (error) { return defaultValue; } 
    };

    const [realSteps, setRealSteps] = useState(0);
    const [realCalories, setRealCalories] = useState(0);
    const [realWeather, setRealWeather] = useState({ temp: '...°C', desc: 'Загрузка погоды...' });
    const [currentPosition, setCurrentPosition] = useState(null);
    const [filteredLocations, setFilteredLocations] = useState([]);
    
    const stepCountRef = useRef(0);
    const lastAccMagnitudeRef = useRef(0);
    const stepCooldownRef = useRef(false);

    const [favs, setFavs] = useState(() => loadFromStorage('app-favs', []));
    const [completed, setCompleted] = useState(() => loadFromStorage('app-completed', []));
    const [account, setAccount] = useState(() => loadFromStorage('app-account', { name: "Гость", level: "Новичок", rewards: [], completedRoutesCount: 0 }));
    const [darkMode, setDarkMode] = useState(() => loadFromStorage('app-darkMode', window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));
    const [units, setUnits] = useState(() => loadFromStorage('app-units', 'km'));
    const [currentLang, setCurrentLang] = useState(() => loadFromStorage('app-lang', 'ru'));
    const [currentCity, setCurrentCity] = useState(() => loadFromStorage('app-city', 'kemerovo'));
    const [rewardModal, setRewardModal] = useState(false);
    const [rewardMsg, setRewardMsg] = useState("");
    const [showContactModal, setShowContactModal] = useState(false);
    const [showNotifPermissionModal, setShowNotifPermissionModal] = useState(false);

    const [showSurvey, setShowSurvey] = useState(false);
const [surveyCompleted, setSurveyCompleted] = useState(() => {
    try {
        return localStorage.getItem('survey-completed') === 'true';
    } catch { return false; }
});
const audioGuideCountRef = useRef(0);
const interactionCountRef = useRef(0);
const regPromptShownRef = useRef(false);

// === СИСТЕМА ТРЕКИНГА СОБЫТИЙ ДЛЯ АНАЛИТИКИ ===
const [eventLog, setEventLog] = useState(() => {
  try {
    const saved = localStorage.getItem('app-eventLog');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
});

const logEvent = useCallback((type, data = {}) => {
    console.log('🔥 logEvent called:', type, data);
  const event = {
    type,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('ru-RU'),
    time: new Date().toLocaleTimeString('ru-RU'),
    city: currentCity,
    lang: currentLang,
    ...data
  };
  setEventLog(prev => {
    const newLog = [...prev, event];
    return newLog.length > 500 ? newLog.slice(-500) : newLog;
  });
  // 2. Отправляем на сервер сразу (fire-and-forget)
  if (currentUserHash) {
    apiCall('logEvent', {
      hash: currentUserHash,
      event: event
    }).catch(e => console.log('Аналитика не отправлена:', e));
  }
  }, [currentCity, currentLang, currentUserHash]);




    const rewardTiers = [{ count: 1, title: "Начинающий" }, { count: 3, title: "Исследователь" }, { count: 5, title: "Магистр" }];
    const buildInfo = { version: "3.3", date: "03.09.2026" }; 
    const routeIcons = { 
        "Культурные и исторические маршруты": <Landmark style={{ color: S.orange500, width: '1.25rem', height: '1.25rem' }} />, 
        "Природные и активные маршруты": <Leaf style={{ color: S.emerald600, width: '1.25rem', height: '1.25rem' }} />, 
        "Семейные маршруты": <Heart style={{ color: S.red500, width: '1.25rem', height: '1.25rem' }} />, 
        "Альтернативные маршруты": <Compass style={{ color: S.sky600, width: '1.25rem', height: '1.25rem' }} />, 
        "Гастрономические маршруты": <MapPin style={{ color: '#a855f7', width: '1.25rem', height: '1.25rem' }} />, 
        "Тематические маршруты": <Activity style={{ color: S.emerald700, width: '1.25rem', height: '1.25rem' }} />, 
        "Современные и урбанистические маршруты": <Monitor style={{ color: S.dark.textMuted, width: '1.25rem', height: '1.25rem' }} /> 
    };

// === 1. ССЫЛКА НА ТАЙМЕР (чтобы он не сбрасывался при перерисовке) ===
const saveTimeoutRef = useRef(null);

// === 2. ФУНКЦИЯ ДЛЯ МГНОВЕННОГО СОХРАНЕНИЯ НА СЕРВЕР ===
const saveUserDataToServer = async (hash, userData) => {
  try {
    await apiCall('saveUserData', { hash, userData });
    console.log('✅ Данные успешно синхронизированы с сервером');
  } catch (e) {
    console.log('⚠️ Не удалось сохранить данные на сервер (офлайн режим?):', e);
  }
};

const debouncedSaveToServer = useCallback((hash, userData) => {
  if (!hash) return;
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  saveTimeoutRef.current = setTimeout(() => {
    saveUserDataToServer(hash, userData);
  }, 2000);
}, []); // saveTimeoutRef — ref, saveUserDataToServer — вне компонента (стабильно)


    // Глобальный метод для показа дашборда из настроек
  
    // === 1. ГЕОЛОКАЦИЯ ===
    useEffect(() => {
        if (!navigator.geolocation) {
            const cityCoords = CITIES.find(c => c.id === currentCity);
            if (cityCoords) setCurrentPosition({ lat: cityCoords.lat, lng: cityCoords.lon });
            return;
        }
        const geoSuccess = (position) => {
            setCurrentPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
        };
        const geoError = () => {
            const cityCoords = CITIES.find(c => c.id === currentCity);
            if (cityCoords) setCurrentPosition({ lat: cityCoords.lat, lng: cityCoords.lon });
        };
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
    }, [currentCity]);

    // === 2. ПОГОДА ===
    useEffect(() => {
        if (!currentPosition) return;
        const weatherCodes = {
            0: 'Ясно', 1: 'Преимущественно ясно', 2: 'Переменная облачность', 3: 'Пасмурно',
            45: 'Туман', 48: 'Изморозь', 51: 'Лёгкая морось', 53: 'Морось', 55: 'Сильная морось',
            61: 'Лёгкий дождь', 63: 'Дождь', 65: 'Сильный дождь', 71: 'Лёгкий снег', 73: 'Снег', 75: 'Сильный снег',
            80: 'Ливень', 81: 'Сильный ливень', 95: 'Гроза', 96: 'Гроза с градом'
        };
        const getAdvice = (temp, code) => {
            if (code >= 95) return 'Гроза. Лучше остаться дома.';
            if (code >= 61 && code <= 82) return 'Дождь. Возьмите зонт.';
            if (code >= 71 && code <= 75) return 'Снег. Одевайтесь теплее.';
            if (temp >= 20 && temp <= 28 && code <= 3) return 'Идеально для прогулки! ☀️';
            if (temp > 28) return 'Жарко. Берите воду.';
            if (temp < 0) return 'Мороз. Тепло одевайтесь.';
            if (temp < 10) return 'Прохладно. Наденьте куртку.';
            return 'Хорошая погода для прогулки.';
        };
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentPosition.lat}&longitude=${currentPosition.lng}&current_weather=true&timezone=auto`)
            .then(res => res.json())
            .then(data => {
                if (data && data.current_weather) {
                    const temp = Math.round(data.current_weather.temperature);
                    const code = data.current_weather.weathercode;
                    const wind = Math.round(data.current_weather.windspeed);
                    const desc = weatherCodes[code] || 'Переменная облачность';
                    setRealWeather({ temp: `${temp}°C`, desc: `${desc}. Ветер ${wind} км/ч. ${getAdvice(temp, code)}` });
                }
            })
            .catch(() => { setRealWeather({ temp: '—°C', desc: 'Не удалось загрузить погоду.' }); });
    }, [currentPosition]);

//_______________________ херь
// === ЕДИНЫЙ ЭФФЕКТ ДЛЯ СОХРАНЕНИЯ ДАННЫХ (LocalStorage + Сервер) ===
useEffect(() => {
  // 1. МГНОВЕННО сохраняем в LocalStorage (чтобы работало без интернета)
  localStorage.setItem('app-favs', JSON.stringify(favs));
  localStorage.setItem('app-completed', JSON.stringify(completed));
  localStorage.setItem('app-account', JSON.stringify(account));
  localStorage.setItem('app-darkMode', JSON.stringify(darkMode));
  localStorage.setItem('app-units', JSON.stringify(units));
  localStorage.setItem('app-lang', JSON.stringify(currentLang));
  localStorage.setItem('app-city', JSON.stringify(currentCity));
  
  if (currentUserHash) {
    const isAgreed = localStorage.getItem(`agreementAccepted_${currentUserHash}`) === 'true';
    
    // 2. ЗАПУСКАЕМ ТАЙМЕР на сохранение в облако
    debouncedSaveToServer(currentUserHash, {
      favs,
      completed,
      account,
      settings: {
        darkMode,
        units,
        lang: currentLang,
        city: currentCity
      },
      surveyCompleted,
      agreementAccepted: isAgreed
    });
  }

  // 3. ОЧИСТКА: если компонент удаляется, отменяем таймер, чтобы не было ошибок
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };
}, [
  // Этот эффект сработает, если изменится ЛЮБОЕ из этих значений:
  favs, 
  completed, 
  account,
  darkMode, 
  units, 
  currentLang, 
  currentCity,
  surveyCompleted, 
  currentUserHash,
  debouncedSaveToServer
]);
//_______________________
    // === 3. ШАГОМЕР ===
    // === ШАГОМЕР ===
    useEffect(() => {
        const today = new Date().toDateString();
        let nativeAvailable = false;
        let StepPluginRef = null;

        const getFromNative = async () => {
            try {
                if (!StepPluginRef) {
                    const { registerPlugin } = await import('@capacitor/core');
                    StepPluginRef = registerPlugin('StepPlugin');
                }
                const result = await StepPluginRef.getSteps();

                if (result && result.steps !== undefined && result.steps > 0) {
                    nativeAvailable = true;
                    const steps = result.steps;
                    const cal = result.calories || Math.round(steps * 0.04);
                    
                    stepCountRef.current = steps;
                    setRealSteps(steps);
                    setRealCalories(cal);

                    localStorage.setItem('steps-data', JSON.stringify({
                        date: today, count: steps, calories: cal, source: 'native'
                    }));
                    return true;
                } else if (result && result.available === false) {
                    console.log('Датчик шагов отсутствует');
                    return false;
                }
                // steps === 0 — может быть начало дня, не ошибка
                if (result && result.steps === 0 && result.available) {
                    nativeAvailable = true;
                    setRealSteps(0);
                    setRealCalories(0);
                    return true;
                }
            } catch (e) {
                console.log('StepPlugin недоступен:', e.message);
            }
            return false;
        };

        const loadSaved = () => {
            const saved = loadFromStorage('steps-data', { date: '', count: 0, calories: 0 });
            if (saved.date === today && saved.count > 0) {
                stepCountRef.current = saved.count;
                setRealSteps(saved.count);
                setRealCalories(saved.calories || Math.round(saved.count * 0.04));
            }
        };

        const startAccelerometer = () => {
            if (!('DeviceMotionEvent' in window)) return;

            const handleMotion = (event) => {
                // Не перезаписываем нативные данные акселерометром
                if (nativeAvailable) return;
                
                const acc = event.accelerationIncludingGravity;
                if (!acc) return;
                const mag = Math.sqrt((acc.x||0)**2 + (acc.y||0)**2 + (acc.z||0)**2);
                const delta = Math.abs(mag - lastAccMagnitudeRef.current);
                lastAccMagnitudeRef.current = mag;
                if (delta > 3.5 && mag > 11 && !stepCooldownRef.current) {
                    stepCooldownRef.current = true;
                    stepCountRef.current += 1;
                    const s = stepCountRef.current;
                    const c = Math.round(s * 0.04);
                    setRealSteps(s);
                    setRealCalories(c);
                    if (s % 10 === 0) {
                        localStorage.setItem('steps-data', JSON.stringify({
                            date: today, count: s, calories: c, source: 'accelerometer'
                        }));
                    }
                    setTimeout(() => { stepCooldownRef.current = false; }, 300);
                }
            };

            const startAcc = async () => {
                if (typeof DeviceMotionEvent.requestPermission === 'function') {
                    try {
                        const p = await DeviceMotionEvent.requestPermission();
                        if (p === 'granted') window.addEventListener('devicemotion', handleMotion);
                    } catch { window.addEventListener('devicemotion', handleMotion); }
                } else {
                    window.addEventListener('devicemotion', handleMotion);
                }
            };
            startAcc();
        };

        const init = async () => {
            // Сначала показываем сохранённые данные (мгновенно)
            loadSaved();

            // Потом пробуем нативный датчик
            const ok = await getFromNative();
            
            // Если нативный не сработал — запускаем акселерометр
            if (!ok) {
                startAccelerometer();
            }

            // Повторная попытка через 2 секунды (датчик может не успеть)
            if (!ok) {
                setTimeout(async () => {
                    await getFromNative();
                }, 2000);
            }
        };

        init();

        // Обновляем каждые 15 секунд
        const interval = setInterval(() => { 
            getFromNative(); 
        }, 15000);

        const save = () => {
            localStorage.setItem('steps-data', JSON.stringify({
                date: today,
                count: stepCountRef.current,
                calories: Math.round(stepCountRef.current * 0.04),
                source: nativeAvailable ? 'native' : 'accelerometer'
            }));
        };
        window.addEventListener('beforeunload', save);
        window.addEventListener('pagehide', save);

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeunload', save);
            window.removeEventListener('pagehide', save);
        };
    }, []);

    // === 4. БЛИЖАЙШИЕ ЛОКАЦИИ ===
    useEffect(() => {
        if (!currentPosition) { setFilteredLocations([]); return; }
        const allRoutes = getRoutesData(currentCity, currentLang);
        const allFlat = Object.values(allRoutes).flatMap(cat => Object.values(cat).flat());
        const uniqueMap = new Map();
        allFlat.forEach(route => {
            if (!route.location || uniqueMap.has(route.name)) return;
            const distKm = calculateDistance(currentPosition.lat, currentPosition.lng, route.location.lat, route.location.lon);
            uniqueMap.set(route.name, { ...route, dist: Math.round(distKm * 1000) });
        });
        const nearby = Array.from(uniqueMap.values()).sort((a, b) => a.dist - b.dist).slice(0, 5);
        setFilteredLocations(nearby);
    }, [currentPosition, currentCity, currentLang]);

    // === СОХРАНЕНИЕ ===
    useEffect(() => { localStorage.setItem('app-favs', JSON.stringify(favs)); }, [favs]);
    useEffect(() => { localStorage.setItem('app-completed', JSON.stringify(completed)); }, [completed]);
    useEffect(() => { localStorage.setItem('app-account', JSON.stringify(account)); }, [account]);
    useEffect(() => { localStorage.setItem('app-darkMode', JSON.stringify(darkMode)); }, [darkMode]);
    useEffect(() => { localStorage.setItem('app-units', JSON.stringify(units)); }, [units]);
    useEffect(() => { localStorage.setItem('app-lang', JSON.stringify(currentLang)); }, [currentLang]);
    useEffect(() => { localStorage.setItem('app-city', JSON.stringify(currentCity)); }, [currentCity]);


// Сохраняем лог событий аналитики
useEffect(() => {
  if (eventLog.length > 0) {
    localStorage.setItem('app-eventLog', JSON.stringify(eventLog));
  }
}, [eventLog]);


    // === УВЕДОМЛЕНИЯ ===
    useEffect(() => {
        const check = async () => {
            try {
                const result = await LocalNotifications.checkPermissions();
                if (result.display === 'granted') return;
                const lastAsked = parseInt(localStorage.getItem('notifPermissionAskedAt') || '0');
                if (Date.now() - lastAsked < 86400000) return;
                setTimeout(() => setShowNotifPermissionModal(true), 3000);
            } catch (e) {}
        };
        if (phase === 'mainApp') check();
    }, [phase]);

    useEffect(() => { 
        const C = darkMode ? S.dark : S.light; 
        document.body.style.backgroundColor = C.bg; 
        const styleTag = document.createElement('style'); 
        styleTag.innerHTML = `html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow-x: hidden; box-sizing: border-box; }`; 
        document.head.appendChild(styleTag); 
        return () => { document.head.removeChild(styleTag); document.body.style.backgroundColor = ''; }; 
    }, [darkMode]);




const handleAuthSuccess = async (hash) => {
  setCurrentUserHash(hash);
  setIsGuest(false);
  const serverData = await loadUserDataFromServer(hash);
  if (serverData) {
    if (serverData.favs) setFavs(serverData.favs);
    if (serverData.completed) setCompleted(serverData.completed);
    if (serverData.account) setAccount(serverData.account);
    if (serverData.settings) {
      if (serverData.settings.darkMode !== undefined) setDarkMode(serverData.settings.darkMode);
      if (serverData.settings.lang) setCurrentLang(serverData.settings.lang);
      if (serverData.settings.city) setCurrentCity(serverData.settings.city);
    }
    if (serverData.surveyCompleted === 'true' || serverData.surveyCompleted === true) {
      setSurveyCompleted(true);
      localStorage.setItem('survey-completed', 'true');
    }
  }
  setPhase('mainApp');
};
const handleGuestSuccess = (hash) => {
  setCurrentUserHash(hash);
  setIsGuest(true);
  setPhase('mainApp');
};
const handleSurveyComplete = async (answers) => {
    setShowSurvey(false);
    setSurveyCompleted(true);
    localStorage.setItem('survey-completed', 'true');
    if (currentUserHash) {
        await apiCall('saveSurvey', {
            hash: currentUserHash,
            surveyData: answers
        });
    }
};

const handleSurveySkip = () => {
    setShowSurvey(false);
};

const promptRegistrationIfNeeded = () => {
  if (regPromptShownRef.current || !isGuest) return;
  regPromptShownRef.current = true;
  // Вызываем глобальный метод, который покажет модалку в MainRouteApp
  if (window.__showRegistrationPrompt) {
    window.__showRegistrationPrompt();
  }
};

const handleAudioGuideOpen = () => {
  if (surveyCompleted) return;
  
  // Увеличиваем счетчик в "сейфе"
  audioGuideCountRef.current += 1;
  console.log('audioGuide count:', audioGuideCountRef.current);
  
  // Если набрали 3 клика — показываем опрос
  if (audioGuideCountRef.current % 3 === 0) {
    setShowSurvey(true);
    audioGuideCountRef.current = 0; // Сбрасываем счетчик, чтобы цикл повторялся
  }
};

const handleLogout = () => {
    localStorage.removeItem('app-auth');
    localStorage.removeItem('app-favs');
    localStorage.removeItem('app-completed');
    localStorage.removeItem('app-account');
    localStorage.removeItem('survey-completed');
    setCurrentUserHash(null);
    setIsGuest(false);
    setFavs([]);
    setCompleted([]);
    setAccount({ name: 'Гость', level: 'Новичок', rewards: [], completedRoutesCount: 0 });
    setPhase('auth');
};
   const handleAcceptAgreement = () => { 
    localStorage.setItem(`agreementAccepted_${currentUserHash}`, 'true'); 
    setPhase('mainApp'); 
};
    const handleExitApp = () => { CapacitorApp.exitApp(); };

    const handleAllowNotifications = async () => {
        setShowNotifPermissionModal(false);
        try { const result = await LocalNotifications.requestPermissions(); if (result.display === 'granted') alert('Уведомления включены! 🎉'); } catch (e) {}
    };
const handleLaterNotifications = () => { setShowNotifPermissionModal(false); localStorage.setItem('notifPermissionAskedAt', Date.now().toString()); };

// === ФУНКЦИЯ ОТПРАВКИ СОБЫТИЙ В АНАЛИТИКУ ===
const logAnalyticsEvent = async (eventType, routeName = '') => {
    if (!currentUserHash) return; // Не логируем гостей (или убери эту строку, если нужно логировать всех)
    try {
        await apiCall('logEvent', {
            hash: currentUserHash,
            eventType: eventType, // 'view', 'audio', 'complete'
            routeName: routeName,
            city: currentCity,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.log('Ошибка отправки аналитики:', e);
    }
};

const handleComplete = useCallback((route) => { 
    if (isGuest) {
        if (window.__showRegistrationPrompt) window.__showRegistrationPrompt();
        return;
    }
    if (completed.some(c => c.name === route.name)) { alert("Этот маршрут уже отмечен как пройденный."); return; } 
    
    // Записываем в аналитику: маршрут завершен
    logEvent('route_completed', { routeName: route.name, city: currentCity });

    const date = new Date(); 
    const newCompleted = [...completed, { ...route, date: date.toLocaleDateString('ru-RU'), isoDate: date.toISOString() }]; 
    setCompleted(newCompleted); 
    const newCount = newCompleted.length; 
    setAccount(prevAccount => { 
            const n = { ...prevAccount, completedRoutesCount: newCount }; 
            const tier = rewardTiers.find(t => t.count === newCount); 
            if (tier && !prevAccount.rewards.includes(tier.title)) { 
                n.level = tier.title; n.rewards.push(tier.title); 
                setRewardMsg(`Поздравляем! Вы получили новое звание: «${tier.title}»!`); 
                setRewardModal(true); 
            } 
            return n; 
        }); 
    }, [completed, rewardTiers, logEvent, currentCity, isGuest]);

    const isFav = useCallback((route) => favs.some(f => f.name === route.name && (f.cityId === currentCity || (!f.cityId && currentCity === 'kemerovo'))), [favs, currentCity]);
const toggleFavorite = useCallback((route) => {
    if (isGuest) {
        if (window.__showRegistrationPrompt) window.__showRegistrationPrompt();
        return;
    }
    
    setFavs(prev => { 
        const isFav = prev.some(f => f.name === route.name && (f.cityId === currentCity || (!f.cityId && currentCity === 'kemerovo'))); 
        
        // Записываем в аналитику: добавление или удаление из избранного
        logEvent(isFav ? 'favorite_removed' : 'favorite_added', { routeName: route.name, city: currentCity });

        if (isFav) return prev.filter(f => !(f.name === route.name && (f.cityId === currentCity || (!f.cityId && currentCity === 'kemerovo')))); 
        else return [...prev, { ...route, cityId: currentCity }]; 
    }); 
}, [currentCity, isGuest, logEvent]); // <-- Добавили logEvent в зависимости

    const appRootStyle = { minHeight: '100vh', width: '100%', backgroundColor: darkMode ? S.dark.bg : S.light.bg, boxSizing: 'border-box' };

    const renderContent = () => {
        switch (phase) {
                        case 'mainApp': 
                if (showDashboard) {
                    return (
                        <>
                            <HealthDashboardScreen 
                                darkMode={darkMode} lang={currentLang} 
                                locations={filteredLocations} currentPosition={currentPosition}
                                steps={realSteps} calories={realCalories} weather={realWeather}
                                onComplete={() => setShowDashboard(false)} 
                            />
                            <LiquidMenu 
                                activeTab="dashboard" 
                                onTabChange={(tabId) => { setShowDashboard(false); }} 
                                onSearchClick={() => {}} 
                                darkMode={darkMode} 
                                lang={currentLang} 
                            />
                        </>
                    );
                }
                return (
                    <MainRouteApp 
                        onExit={() => { setShowDashboard(true); handleExitApp(); }} 
                        showSurvey={showSurvey}
                        favoriteRoutes={favs} completedRoutes={completed} 
                        handleRouteCompletionGlobal={handleComplete} 
                        isRouteInFavorites={isFav} toggleFavorite={toggleFavorite} 
                        account={account} darkMode={darkMode} setDarkMode={setDarkMode} 
                        units={units} setUnits={setUnits} routeIcons={routeIcons} 
                        buildInfo={buildInfo} setShowContactModal={setShowContactModal} 
                        setAccount={setAccount} currentLang={currentLang} setCurrentLang={setCurrentLang} 
                        currentCity={currentCity} setCurrentCity={setCurrentCity} 
                        isGuest={isGuest}
currentUserHash={currentUserHash}
onGoToRegister={handleGoToRegister}
logEvent={logEvent}
                    />
                );

case 'auth':
    return <AuthScreen 
        darkMode={darkMode} 
        onAuthSuccess={handleAuthSuccess}
        onGuestSuccess={handleGuestSuccess}
        initialMode={authInitialMode}
    />;

            default:
                return (
                    <HealthDashboardScreen 
                        darkMode={darkMode} lang={currentLang} locations={[]} currentPosition={null}
                        steps={0} calories={0} weather={{ temp: '...°C', desc: 'Загрузка...' }}
                        onComplete={() => setShowDashboard(false)} 
                    />
                );
        }
    };
   
// Глобальные методы для навигации
useEffect(() => {
  window.__showDashboard = () => { setShowDashboard(true); };
  window.__handleLogout = handleLogout;
  window.__handleAudioGuideOpen = handleAudioGuideOpen;
  
  // 👇 ДОБАВЛЯЕМ СЧЕТЧИК ДЛЯ ПРЕДЛОЖЕНИЯ РЕГИСТРАЦИИ (на 2-й раз)
  window.__trackAudioInteraction = () => {
    interactionCountRef.current += 1;
    if (interactionCountRef.current === 2) {
      promptRegistrationIfNeeded();
    }
  };

  return () => {
    delete window.__showDashboard;
    delete window.__handleLogout;
    delete window.__handleAudioGuideOpen;
    delete window.__trackAudioInteraction;
  };
}, [handleLogout, handleAudioGuideOpen, promptRegistrationIfNeeded]);

   return (
    <div style={appRootStyle}>
        {renderContent()}
        {showSurvey && (
            <SurveyModal
                darkMode={darkMode}
                onComplete={handleSurveyComplete}
                onSkip={handleSurveySkip}
            />
        )}
        <Modal show={rewardModal} message={rewardMsg} onClose={() => setRewardModal(false)} darkMode={darkMode} buttonText="Отлично!" lang={currentLang} />
        <ContactModal show={showContactModal} onClose={() => setShowContactModal(false)} darkMode={darkMode} lang={currentLang} />
        <NotificationPermissionModal show={showNotifPermissionModal} onAllow={handleAllowNotifications} onLater={handleLaterNotifications} darkMode={darkMode} lang={currentLang} />
    </div>
);
}
