(async function(){
  async function optimize(payload){
    const res = await fetch((window.CONFIG?.API_BASE || "") + "/api/traffic/optimize", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error("API error");
    return res.json();
  }

  function drawBars(values){
    const el = document.getElementById("chart");
    el.innerHTML = "";
    const max = Math.max(...values, 1);
    values.forEach((v,i)=>{
      const bar = document.createElement("div");
      bar.style.height = "20px";
      bar.style.background = "linear-gradient(90deg,#24b4ff,#00d084)";
      bar.style.width = (v/max*100).toFixed(1) + "%";
      bar.style.borderRadius = "8px";
      bar.style.margin = "6px 0";
      bar.textContent = `Approach ${i+1}: ${v}s`;
      bar.style.paddingLeft = "8px";
      el.appendChild(bar);
    });
  }

  function parseDemand() {
    const fields = [...document.querySelectorAll(".demand-input")];
    return fields.map(f => Math.max(0, parseInt(f.value || "0", 10)));
  }

  document.getElementById("runBtn").addEventListener("click", async ()=>{
    const approaches = parseInt(document.getElementById("approaches").value, 10);
    const intersections = parseInt(document.getElementById("intersections").value, 10);
    const demand = parseDemand().slice(0, approaches);

    document.getElementById("status").textContent = "优化中...";
    try {
      const res = await optimize({ approaches, intersections, demand });
      document.getElementById("status").textContent = `效率评分: ${res.efficiency_score}`;
      drawBars(res.green_times || []);
    } catch(e){
      document.getElementById("status").textContent = "请求失败";
      console.error(e);
    }
  });

  // preset
  drawBars([20,20,20,20]);
})();