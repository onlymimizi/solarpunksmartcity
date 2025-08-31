(function(){
  async function analyze(payload){
    const res = await fetch((window.CONFIG?.API_BASE || "") + "/api/health/analyze", {
      method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error("API error");
    return res.json();
  }

  function renderAdvice(data){
    const out = document.getElementById("advice");
    out.innerHTML = "";
    const h = document.createElement("div");
    h.className = "kpi";
    h.textContent = `风险评分: ${data.risk_score}`;
    out.appendChild(h);

    const sec = (title, items)=>{
      const card = document.createElement("div");
      card.className = "card";
      const t = document.createElement("div");
      t.style.color = "#9fb3c8";
      t.style.marginBottom = "6px";
      t.textContent = title;
      card.appendChild(t);
      const ul = document.createElement("ul");
      items.forEach(s=>{ const li = document.createElement("li"); li.textContent = s; ul.appendChild(li); });
      card.appendChild(ul);
      out.appendChild(card);
    }
    sec("洞察", data.insights || []);
    sec("建议", data.recommendations || []);
  }

  document.getElementById("healthBtn").addEventListener("click", async ()=>{
    const payload = {
      hr_rest: parseInt(document.getElementById("hr_rest").value, 10),
      sleep_hours: parseFloat(document.getElementById("sleep_hours").value),
      steps: parseInt(document.getElementById("steps").value, 10),
      age: parseInt(document.getElementById("age").value, 10),
      conditions: document.getElementById("conditions").value.trim() ? document.getElementById("conditions").value.split(",").map(s=>s.trim()) : []
    };
    document.getElementById("hstatus").textContent = "分析中...";
    try {
      const data = await analyze(payload);
      document.getElementById("hstatus").textContent = "完成";
      renderAdvice(data);
    } catch(e){
      document.getElementById("hstatus").textContent = "请求失败";
      console.error(e);
    }
  });
})();