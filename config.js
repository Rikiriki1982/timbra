/* Timbra: elenco delle ditte che usano l'app.
   Ogni ditta ha il suo database Supabase. Per aggiungerne una copia la riga che ti prepara
   la pagina «installa/» e incollala qui sotto, prima della riga "};".
   Il link personale della ditta è: indirizzo dell'app + ?ditta=codice  (es. .../timbra/?ditta=rossi)
   Senza ?ditta l'app apre la ditta predefinita (la prima, lumia). */
window.PTP_DITTE={
  lumia:{url:"https://avhuwfxqcmcdzrgcxrlf.supabase.co",vapid:"BNRKyR-XrOplFFz_RGrGB6UTiE4enmGggk2al74aZNx_vIT3yuJMNv9iOqtxTP0Di5C97_C28B_5FlR4Iuhh8UA",key:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aHV3ZnhxY21jZHpyZ2N4cmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MDEwODQsImV4cCI6MjEwOTM3NzA4NH0.EXkL2QoRiyIzvgwCCydi9VyFeb2IMulS883WD8Xajig"},
};

/* scelta della ditta: ?ditta=codice nel link (viene ricordata su questo dispositivo) */
(function(){
  const D=window.PTP_DITTE,DEF=Object.keys(D)[0];let c=null,saved=null;
  try{c=new URLSearchParams(location.search).get("ditta")}catch(e){}
  try{saved=localStorage.getItem("ptp_ditta")}catch(e){}
  if(c&&D[c]){try{localStorage.setItem("ptp_ditta",c)}catch(e){}}else c=saved&&D[saved]?saved:DEF;
  window.PTP_DITTA=c;window.PTP_CFG=D[c];
  /* indirizzo dell'app per inviti e password: porta sempre alla ditta giusta, anche su un telefono nuovo */
  const root=location.origin+location.pathname.replace(/[^/]*$/,"").replace(/\/preventivi\/$/,"/");
  window.PTP_LINK=c===DEF?location.origin+location.pathname:root+"?ditta="+encodeURIComponent(c);
  /* app installata sul telefono: si riapre sulla stessa ditta */
  if(c!==DEF&&document.currentScript){
    try{const m={name:"Presenze & Ticket Pro",short_name:"Presenze",start_url:PTP_LINK,scope:root,display:"standalone",orientation:"portrait",
      background_color:"#0e1320",theme_color:"#4f46e5",lang:"it",icons:[192,512].map(s=>({src:root+"icon-"+s+".png",sizes:s+"x"+s,type:"image/png",purpose:"any maskable"}))};
      const set=()=>{const l=document.querySelector('link[rel="manifest"]');if(l)l.href="data:application/manifest+json,"+encodeURIComponent(JSON.stringify(m))};
      document.readyState==="loading"?document.addEventListener("DOMContentLoaded",set):set()}catch(e){}
  }
})();
