(function(){
    const MAX_ACTIONS = 10;
    const WINDOW_TIME = 10000;
    const BLOCK_TIME = 180000;
    let actions = [];
    let blockedUntil = 0;
    let token = generateToken();

    function generateToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b=>b.toString(16).padStart(2,'0')).join('');
    }

    function blockUser(reason="Подозрительная активность") {
        blockedUntil = Date.now()+BLOCK_TIME;
        document.body.innerHTML = `<h1>Доступ временно заблокирован</h1><p>${reason}</p>`;
        document.body.style.background="#000";
        document.body.style.color="#f00";
        document.body.style.textAlign="center";
        document.body.style.fontSize="2em";
        console.warn("Пользователь заблокирован: " + reason);
    }

    function checkActions() {
        if(Date.now()<blockedUntil) return true;
        const now = Date.now();
        actions = actions.filter(t=>now-t<WINDOW_TIME);
        if(actions.length>MAX_ACTIONS) { blockUser("Превышение лимита действий"); return true; }
        return false;
    }

    function addAction(e){
        if(e?.type==="mousemove" && Math.random()>0.97) return;
        actions.push(Date.now());
        checkActions();
    }

    ["click","mousemove","keydown","scroll","wheel"].forEach(evt=>document.addEventListener(evt,addAction));

    const origFetch = window.fetch;
    window.fetch=function(url,opts={}) {
        addAction();
        if(checkActions()) return new Promise(()=>{});
        opts.headers = opts.headers||{};
        opts.headers['X-Client-Token']=token;
        return origFetch(url,opts);
    };

    const origWS = window.WebSocket;
    window.WebSocket=function(url,protocols){
        addAction();
        if(checkActions()) return;
        const ws = new origWS(url,protocols);
        ws.addEventListener('open',()=>ws.send(JSON.stringify({token})));
        return ws;
    };

    // Ловушки для ботов
    setInterval(()=>{
        if(checkActions()) return;
        const frag=document.createDocumentFragment();
        for(let i=0;i<100;i++){
            const div=document.createElement("div");
            div.style.position="absolute";
            div.style.top=Math.random()*window.innerHeight+"px";
            div.style.left=Math.random()*window.innerWidth+"px";
            frag.appendChild(div);
        }
        document.body.appendChild(frag);

        // CPU/Memory нагрузка на ботов
        const arr=Array.from({length:5000},(_,i)=>Math.sin(i*i));
        arr.sort(()=>Math.random()-0.5);
    },3000);

    let lastMove=Date.now();
    document.addEventListener('mousemove',()=> {
        const now=Date.now();
        if(now-lastMove<3) blockUser("Слишком быстрые движения");
        lastMove=now;
    });

    // Поддельные сетевые активности
    setInterval(()=>{
        if(checkActions()) return;
        fetch("/fake-endpoint?"+Math.random());
        new Image().src="/fake-image?"+Math.random();
    },5000);

    console.log("Анти-DDoS 2.0 активирован: полный контроль над действиями пользователя");
})();
