<script>
// ==================== CONFIG ====================
const allowedBrowsers = ["Chrome","Firefox","Safari","Edge"];
const maxVisitsPerMinute = 2;
const cpuTrapIterations = 1e7;
const domTrapCount = 500;
const randomDelayMax = 3000;
const overloadThreshold = 3;
let overloadCounter = 0;
let freezeInterface = false;
let globalBlocked = false;
let fakeServerLoad = 0;
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
["mousemove","keydown","scroll","touchstart"].forEach(evt => {
    document.addEventListener(evt, () => lastMove = Date.now());
});
setInterval(()=>{
    if(Date.now()-lastMove>2000 || freezeInterface || globalBlocked) blockPage("Подозрительная активность");
},500);

// ===== Анти-копирование и DOM =====
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
    const fake=document.createElement("div");
    fake.style.display="none";
    fake.className="fake-node";
    document.body.appendChild(fake);
}

// ===== CPU ловушки =====
function heavyCpuTrap(){
    if(globalBlocked || freezeInterface) return;
    for(let i=0;i<cpuTrapIterations;i++) Math.sqrt(i);
    fakeServerLoad++;
    if(fakeServerLoad>overloadThreshold) blockPage("Сайт перегружен. Новые запросы отклоняются");
}
setInterval(heavyCpuTrap,1000);

// ===== Случайные замедления =====
function randomDelay(){
    if(globalBlocked || freezeInterface) return;
    const delay = Math.random()*randomDelayMax;
    const start = Date.now();
    while(Date.now()-start<delay){}
}
setInterval(randomDelay,1500);

// ===== Подозрительные клиенты =====
function botDetection(){
    if(globalBlocked || freezeInterface) return;
    if(navigator.webdriver || navigator.plugins.length===0 || navigator.hardwareConcurrency===0) blockPage("Бот обнаружен. Доступ запрещён");
}
botDetection();
setInterval(botDetection,2000);

// ===== Защита от массовых запросов =====
let suspiciousCounter=0;
setInterval(()=>{
    if(globalBlocked || freezeInterface) return;
    suspiciousCounter++;
    if(suspiciousCounter>3) blockPage("Подозрительная активность. Доступ заблокирован.");
},3000);

// ===== Блокировка страницы =====
function blockPage(message){
    freezeInterface=true;
    globalBlocked=true;
    document.body.innerHTML=`<h1>${message}</h1>`;
    throw message;
}

// ===== Обфускация DOM =====
setInterval(()=>{
    if(globalBlocked || freezeInterface) return;
    const nodes=document.querySelectorAll(".fake-node");
    nodes.forEach(n=>n.style.display=Math.random()<0.5?"none":"block");
},1000);

// ===== Фальшивые запросы =====
setInterval(()=>{
    if(globalBlocked || freezeInterface) return;
    fetch("/",{method:"POST"}).catch(()=>{});
},2000);
</script>
