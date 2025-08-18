// ==================== CONFIG ====================
const allowedBrowsers = ["Chrome","Firefox","Safari","Edge"];
const maxVisitsPerMinute = 2;
const cpuTrapIterations = 1e6; // уменьшено, не грузит
const domTrapCount = 100;
const randomDelayMax = 1000;
let overloadCounter = 0;
let freezeInterface = false;
let globalBlocked = false;
// ================================================

// ===== Проверка User-Agent и ботов =====
if(!allowedBrowsers.some(b => navigator.userAgent.includes(b))) blockPage("Доступ запрещён");
if(navigator.webdriver || navigator.plugins.length === 0 || navigator.hardwareConcurrency === 0) blockPage("Бот обнаружен");

// ===== Лимит посещений =====
const visits = JSON.parse(localStorage.getItem("visitTimes") || "[]");
const now = Date.now();
const minuteAgo = now - 60000;
const recentVisits = visits.filter(t => t > minuteAgo);
recentVisits.push(now);
localStorage.setItem("visitTimes", JSON.stringify(recentVisits));
if(recentVisits.length > maxVisitsPerMinute) blockPage("Слишком много запросов с вашего устройства");

// ===== Idle/Заморозка =====
let lastMove = Date.now();
["mousemove","keydown","scroll","touchstart"].forEach(evt => document.addEventListener(evt, () => lastMove = Date.now()));
setInterval(()=>{
    if(Date.now()-lastMove>5000 || freezeInterface || globalBlocked) blockPage("Подозрительная активность");
},500);

// ===== Анти-копирование =====
document.addEventListener("contextmenu", e=>e.preventDefault());
document.addEventListener("copy", e=>e.preventDefault());
document.addEventListener("cut", e=>e.preventDefault());
document.addEventListener("keydown", e=>{
    if(e.ctrlKey && ["u","s","c","p"].includes(e.key.toLowerCase())) e.preventDefault();
});
document.body.style.userSelect="none";

// ===== Основное содержимое =====
const main = document.createElement("div");
main.id = "main-content";
main.innerHTML = "<h1>Страница загружена безопасно</h1>";
document.body.appendChild(main);

// ===== DOM ловушки =====
for(let i=0;i<domTrapCount;i++){
    const fake = document.createElement("div");
    fake.style.display="none";
    fake.className="fake-node";
    document.body.appendChild(fake);
}
setInterval(()=>{
    if(globalBlocked || freezeInterface) return;
    document.querySelectorAll(".fake-node").forEach(n=>{
        n.style.display = Math.random()<0.5 ? "none" : "block";
    });
},1000);

// ===== CPU ловушки =====
function heavyCpuTrap(){
    if(globalBlocked || freezeInterface) return;
    for(let i=0;i<cpuTrapIterations;i++) Math.sqrt(i);
}
setInterval(heavyCpuTrap,2000);

// ===== Случайные задержки =====
function randomDelay(){
    if(globalBlocked || freezeInterface) return;
    const delay = Math.random()*randomDelayMax;
    setTimeout(()=>{}, delay);
}
setInterval(randomDelay,1500);

// ===== Проверка подозрительных клиентов =====
function botDetection(){
    if(globalBlocked || freezeInterface) return;
    if(navigator.webdriver || navigator.plugins.length===0 || navigator.hardwareConcurrency===0) blockPage("Бот обнаружен. Доступ запрещён");
}
botDetection();
setInterval(botDetection,3000);

// ===== Блокировка страницы =====
function blockPage(message){
    freezeInterface=true;
    globalBlocked=true;
    document.body.innerHTML=`<h1>${message}</h1>`;
    throw message;
}
