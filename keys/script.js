
const http = require('http');
const url = require('url');
const https = require('https');

const KEYS_URL = 'https://raw.githubusercontent.com/borisk202/Mirror/refs/heads/main/keys/Keys.txt';

// Скрипт, который будет возвращаться по правильному ключу
const SCRIPT_CONTENT = `
// Автоматически выбрасывает пользователя с текущей страницы
if (window.confirm("Ключ верный.")) {
    window.open('', '_self').close(); // Попытка закрыть вкладку
} else {
    window.location.href = 'about:blank'; // Перенаправление на пустую страницу
}
`;

function fetchText(urlToFetch, callback) {
    https.get(urlToFetch, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => callback(data));
    }).on('error', (err) => {
        console.error('Error fetching:', err);
        callback('');
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;

    res.setHeader('Content-Type', 'text/plain');

    if (path === '/auth/key') {
        const key = query.key;

        if (!key) {
            res.statusCode = 200;
            res.end('OK');
            return;
        }

        fetchText(KEYS_URL, (keysText) => {
            const keys = keysText.split(/\r?\n/).map(k => k.trim()).filter(k => k !== '');
            if (keys.includes(key)) {
                // Ключ верный — отдаём скрипт
                res.statusCode = 200;
                res.end(SCRIPT_CONTENT);
            } else {
                // Ключ неверный
                res.statusCode = 401;
                res.end('Ключ неверный');
            }
        });
    } else {
        res.statusCode = 404;
        res.end('Страница не найдена');
    }
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
