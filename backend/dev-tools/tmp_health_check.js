 (async ()=>{
  try{
    const res = await fetch('http://localhost:4000/health');
    const txt = await res.text();
    console.log('status', res.status);
    console.log(txt);
  }catch(e){
    console.error('err', e && e.message ? e.message : e);
  }
})();
