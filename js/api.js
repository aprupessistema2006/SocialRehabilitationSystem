(function(){
  window.SRS_DEBUG = window.SRS_DEBUG || { logs: [], last: {}, info: {} };
  function dbgPush(entry){
    try{
      entry.ts = new Date().toISOString();
      window.SRS_DEBUG.logs.push(entry);
      if(window.SRS_DEBUG.logs.length > 50) window.SRS_DEBUG.logs.shift();
      window.SRS_DEBUG.last[entry.action || 'unknown'] = entry;
    }catch(e){}
  }
  function maskToken(t){ if(!t) return ''; t=String(t); return t.length>10 ? (t.slice(0,6)+'…'+t.slice(-4)) : '***'; }
  function safeJsonParse(txt){ try{ return {ok:true, json:JSON.parse(txt)}; }catch(e){ return {ok:false, err:String(e), text:String(txt||'').slice(0,500)}; } }
  function summarize(res){
    if(!res || typeof res!=='object') return res;
    var o={};
    Object.keys(res).forEach(function(k){
      if(k==='fileBase64') o[k]='[base64 '+String(res[k]||'').length+' chars]';
      else o[k]=res[k];
    });
    return o;
  }
  function selfHealAuth(reason){
    try{
      var hadToken = !!getToken();
      console.warn('[SRS][self-heal] Auth/token problēma:', reason, 'hadToken=', hadToken);
      localStorage.removeItem('srs_access_token');
      localStorage.removeItem('currentUser');
      // ja neesam login lapā, pāradresējam uz login ar iemeslu
      var p = String(location.pathname||'');
      if(p.indexOf('index.html')===-1 && p.slice(-1)!=='/' && p.indexOf('pirmais-darbinieks')===-1){
        var url = (p.indexOf('/pages/')>=0 ? '../index.html' : 'index.html') + '?reason=' + encodeURIComponent(reason||'auth');
        setTimeout(function(){ window.location.href = url; }, 300);
      }
    }catch(e){ console.error('[SRS][self-heal] failed', e); }
  }

  window.api = function(action, payload){
    payload=payload||{}; payload.action=action;
    var started = Date.now();
    var token = getToken();
    if (!token && action !== 'getAppInfo') {
      console.warn('[SRS][api]', action, 'nav tokena');
      window.location.href = '../index.html';
      return Promise.reject({ok:false, reason:'nav_token'});
    }
    if(token) payload.access_token = token;
    if (typeof window.showLoader === 'function') window.showLoader('Datu apstrāde...');
    var url = (typeof WEBAPP_URL!=='undefined'?WEBAPP_URL:'');
    console.groupCollapsed('[SRS][api] →', action, {url:url, hasToken:!!token, payloadKeys:Object.keys(payload)});
    return fetch(url,{method:'POST',body:new URLSearchParams({data:JSON.stringify(payload)})})
      .then(function(r){
        var ct = (r.headers && r.headers.get ? r.headers.get('content-type') : '') || '';
        console.log('[SRS][api] http', {status:r.status, ok:r.ok, type:r.type, redirected:r.redirected, contentType:ct, url:r.url});
        return r.text().then(function(txt){
          var parsed = safeJsonParse(txt);
          var ms = Date.now()-started;
          if(!parsed.ok){
            var entryBad={action:action, ok:false, reason:'invalid_json', ms:ms, raw:parsed.text, token:maskToken(token)};
            dbgPush(entryBad);
            console.error('[SRS][api] ne-JSON atbilde', parsed.text);
            console.groupEnd();
            return Promise.reject({ok:false, reason:'invalid_json', raw:parsed.text});
          }
          var res = parsed.json;
          var entry={action:action, ok:!!(res&&res.ok), reason:res&&res.reason, exportWarning:res&&res.exportWarning, err:res&&res.err, ms:ms, url:url, token:maskToken(token), summary:summarize(res)};
          dbgPush(entry);
          if(res && res.ok){ console.log('[SRS][api] OK', action, entry.summary); }
          else { console.warn('[SRS][api] FAIL', action, entry.summary); }
          console.groupEnd();
          // pašārstēšanās: nederīgs tokens šim deploymentam
          if(res && res.ok===false && String(res.reason||'')==='nav_kopējā_parole' && token){
            selfHealAuth('nav_kopējā_parole/token_neder');
          }
          return res;
        });
      })
      .catch(function(err){
        var ms = Date.now()-started;
        var entryErr={action:action, ok:false, reason:'network_error', ms:ms, err:String(err&&err.message||err), url:url, token:maskToken(token)};
        dbgPush(entryErr);
        console.error('[SRS][api] tīkla/kļūdas izņēmums', action, err);
        try{ console.groupEnd(); }catch(e){}
        return Promise.reject({ok:false, reason:'network_error', err:String(err&&err.message||err)});
      })
      .finally(function(){ if (typeof window.hideLoader === 'function') window.hideLoader(); });
  };

  window.currentUser = function(){ try{return JSON.parse(localStorage.getItem('currentUser')||'{}');}catch(e){return {};} };
  window.getToken = function(){ try{ return localStorage.getItem('srs_access_token')||''; }catch(e){return '';} };
  window.requireUser = function(){ var u=currentUser(); if(!u.id||!getToken()){ window.location.href='../index.html'; return u; } return u; };
  window.esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  window.fmt = function(v){ return v==null?'':String(v); };
  window.setMsg = function(id,text,cls){ var el=document.getElementById(id); if(!el) return; el.className='alert '+(cls||''); el.textContent=text||''; el.style.display=text?'block':'none'; };
  window.byId = function(id){ return document.getElementById(id); };
})();

