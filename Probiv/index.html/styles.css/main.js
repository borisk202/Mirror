document.addEventListener('deviceready', () => {
    const prefs = {
        get: (key, defaultValue) => localStorage.getItem(key) || defaultValue,
        put: (key, value) => localStorage.setItem(key, value),
        getLong: (key, defaultValue) => parseInt(localStorage.getItem(key) || defaultValue, 10),
        putLong: (key, value) => localStorage.setItem(key, value)
    };
    let warnEnd = prefs.getLong('warn_end', 0);
    let captchaBanEnd = prefs.getLong('captcha_ban_end', 0);

    function showUnclosablePopup(title, message, autoDismiss = true) {
        const popup = document.getElementById('popup');
        document.getElementById('popup-title').innerText = title;
        document.getElementById('popup-message').innerText = message;
        popup.style.display = 'flex';
        document.getElementById('popup-btn').onclick = () => {
            if (autoDismiss) popup.style.display = 'none';
        };
        if (navigator.vibrate) navigator.vibrate(1000);
    }

    function checkProtections() {
        // Анти-дебуг
        if (window.console && (console.debug.toString().includes('native') || console.log.toString().includes('native'))) {
            showUnclosablePopup('Дебуг', 'Хакер хуёвый, самоуничтожение!', false);
            setTimeout(() => navigator.app.exitApp(), 2000);
        }
        // Анти-Frida (порт 27042)
        fetch('http://127.0.0.1:27042').then(() => {
            showUnclosablePopup('Frida', 'Frida пиздец, бан!', false);
            navigator.app.exitApp();
        }).catch(() => {});
        // Анти-root/emulator
        if (navigator.userAgent.includes('Emulator') || navigator.userAgent.includes('Genymotion')) {
            showUnclosablePopup('Root/Emulator', 'Бан навсегда, сука!', false);
            navigator.app.exitApp();
        }
        // WiFi check
        if (!navigator.onLine) applyWifiDisconnectWarn();
        // Анти-скриншот (Cordova SecureScreen plugin, если установлен)
        if (window.plugins && window.plugins.secureScreen) {
            window.plugins.secureScreen.enable(() => {}, () => {});
        }
    }

    function applyWifiDisconnectWarn() {
        showUnclosablePopup('WiFi Отрублен', 'Похер, варн нахуй!');
        if (Math.random() < 0.7) {
            warnEnd = Date.now() + 20 * 60 * 1000;
            prefs.putLong('warn_end', warnEnd);
            showUnclosablePopup('Варн', '408 Request Timeout, 20 мин бан!');
        }
    }

    function showCaptchaPopup() {
        const captchaText = Array(6).fill().map(() => String.fromCharCode(65 + Math.floor(Math.random() * 36))).join('');
        showUnclosablePopup('Проверка на Робота', `Введи: ${captchaText}`, false);
        const input = document.createElement('input');
        input.type = 'text';
        document.getElementById('popup-message').appendChild(input);
        document.getElementById('popup-btn').onclick = () => {
            if (input.value === captchaText) {
                document.getElementById('popup').style.display = 'none';
                if (warnEnd <= Date.now() && captchaBanEnd <= Date.now()) {
                    switchToMain2();
                }
            } else {
                showUnclosablePopup('Fail', 'Робот, сука? Бан 10 мин!');
                captchaBanEnd = Date.now() + 10 * 60 * 1000;
                prefs.putLong('captcha_ban_end', captchaBanEnd);
                document.body.classList.add('red-flash');
                navigator.vibrate(1000);
            }
        };
    }

    function switchToMain2() {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('main2-screen').style.display = 'block';
    }

    function applyCheckpoint(tool, data) {
        prefs.put(`last_input_${tool}`, btoa(data));
        prefs.putLong(`progress_${tool}`, 1);
    }

    function restoreCheckpoints() {
        const lastInput = prefs.get('last_input_ip_logger', '');
        if (lastInput) document.getElementById('input-field').value = atob(lastInput);
    }

    // Инструменты
    document.getElementById('subscribe-btn').onclick = () => {
        document.getElementById('subscribe-btn').classList.add('shake');
        setTimeout(() => document.getElementById('subscribe-btn').classList.remove('shake'), 500);
        showUnclosablePopup('Ошибка Подписки', 'Сервер BDMI заблокирован, 400 Bad Request, пиздец!');
        navigator.vibrate(300);
    };

    document.getElementById('software-info-btn').onclick = () => {
        if (checkConditions()) return;
        document.getElementById('software-info-btn').classList.add('shake');
        setTimeout(() => document.getElementById('software-info-btn').classList.remove('shake'), 500);
        applyCheckpoint('software_info', 'info');
        const info = `OS: ${navigator.platform}\nUserAgent: ${navigator.userAgent}`;
        showUnclosablePopup('Инфо о ПО', info);
        navigator.vibrate(300);
    };

    document.getElementById('ip-logger-btn').onclick = () => {
        if (checkConditions()) return;
        document.getElementById('ip-logger-btn').classList.add('shake');
        setTimeout(() => document.getElementById('ip-logger-btn').classList.remove('shake'), 500);
        const url = document.getElementById('input-field').value;
        applyCheckpoint('ip_logger', url);
        fetch(`https://api.example.com/log?target=${url}`).then(res => res.text())
            .then(data => showUnclosablePopup('IP Logger', `Logger link: ${data}`))
            .catch(() => showUnclosablePopup('IP Logger', 'Ошибка, сука!'));
        navigator.vibrate(300);
    };

    document.getElementById('anti-ip-logger-btn').onclick = () => {
        if (checkConditions()) return;
        document.getElementById('anti-ip-logger-btn').classList.add('shake');
        setTimeout(() => document.getElementById('anti-ip-logger-btn').classList.remove('shake'), 500);
        const url = document.getElementById('input-field').value;
        applyCheckpoint('anti_ip_logger', url);
        if (url.toLowerCase().includes('iplogger') || url.toLowerCase().includes('grabify')) {
            showUnclosablePopup('Anti IP Logger', 'Это логгер, сука! Опасно.');
        } else {
            showUnclosablePopup('Anti IP Logger', 'Кажется чисто.');
        }
        navigator.vibrate(300);
    };

    document.getElementById('device-fingerprint-btn').onclick = () => {
        if (checkConditions()) return;
        document.getElementById('device-fingerprint-btn').classList.add('shake');
        setTimeout(() => document.getElementById('device-fingerprint-btn').classList.remove('shake'), 500);
        applyCheckpoint('device_fingerprint', 'fingerprint');
        const fingerprint = `Screen: ${window.screen.width}x${window.screen.height}\nLang: ${navigator.language}\nDevice: ${navigator.userAgent}`;
        showUnclosablePopup('Device Fingerprint', fingerprint);
        navigator.vibrate(300);
    };

    document.getElementById('network-scanner-btn').onclick = () => {
        if (checkConditions()) return;
        document.getElementById('network-scanner-btn').classList.add('shake');
        setTimeout(() => document.getElementById('network-scanner-btn').classList.remove('shake'), 500);
        applyCheckpoint('network_scanner', 'scan');
        showUnclosablePopup('Network Scanner', 'WiFi scan недоступен в WebView, сука!');
        navigator.vibrate(300);
    };

    document.getElementById('password-cracker-btn').onclick = () => {
        if (checkConditions()) return;
        document.getElementById('password-cracker-btn').classList.add('shake');
        setTimeout(() => document.getElementById('password-cracker-btn').classList.remove('shake'), 500);
        const hash = document.getElementById('input-field').value;
        applyCheckpoint('password_cracker', hash);
        for (let i = 0; i < 10000; i++) {
            const testPass = `${i}`.padStart(4, '0');
            if (CryptoJS.MD5(testPass).toString() === hash) {
                showUnclosablePopup('Password Cracker', `Пароль: ${testPass}`);
                return;
            }
        }
        showUnclosablePopup('Password Cracker', 'Не взломано, сука!');
        navigator.vibrate(300);
    };

    function checkConditions() {
        if (warnEnd > Date.now()) {
            showUnclosablePopup('Варн', `Ещё ${(warnEnd - Date.now()) / 60000 | 0} мин, жди!`);
            return true;
        }
        if (captchaBanEnd > Date.now()) {
            showUnclosablePopup('Captcha Ban', `Ещё ${(captchaBanEnd - Date.now()) / 60000 | 0} мин, робот!`);
            return true;
        }
        if (!navigator.onLine) {
            applyWifiDisconnectWarn();
            return true;
        }
        return false;
    }

    // Инициализация
    checkProtections();
    showCaptchaPopup();
    restoreCheckpoints();
    setInterval(checkProtections, 30000);
}, false);
