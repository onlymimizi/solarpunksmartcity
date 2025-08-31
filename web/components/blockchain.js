(async function(){
  const { ethers } = window;
  let provider, signer, contract;

  async function connect() {
    if (!window.ethereum) throw new Error("No wallet found");
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    const addr = window.CONFIG?.CONTRACT_ADDRESS;
    const abi = window.CONFIG?.CONTRACT_ABI;
    if (!addr) throw new Error("请先在 config.js 中配置 CONTRACT_ADDRESS");
    contract = new ethers.Contract(addr, abi, signer);
    return await signer.getAddress();
  }

  async function setRecord(key, value){
    if(!contract) await connect();
    const tx = await contract.setRecord(key, value);
    document.getElementById("bstatus").textContent = "等待交易确认...";
    const rec = await tx.wait();
    document.getElementById("bstatus").textContent = "已确认: " + rec.hash;
  }

  async function getRecord(key){
    if(!contract) await connect();
    return await contract.getRecord(key);
  }

  document.getElementById("connectBtn").addEventListener("click", async ()=>{
    try {
      const addr = await connect();
      document.getElementById("wallet").textContent = "已连接: " + addr;
    } catch(e){ alert(e.message); }
  });

  document.getElementById("setBtn").addEventListener("click", async ()=>{
    const k = document.getElementById("bkey").value.trim();
    const v = document.getElementById("bval").value.trim();
    if(!k) return alert("请输入Key");
    try { await setRecord(k, v || ""); } catch(e){ alert(e.message); }
  });

  document.getElementById("getBtn").addEventListener("click", async ()=>{
    const k = document.getElementById("bkey").value.trim();
    if(!k) return alert("请输入Key");
    try { const v = await getRecord(k); document.getElementById("bresult").textContent = v || "(空)"; }
    catch(e){ alert(e.message); }
  });
})();