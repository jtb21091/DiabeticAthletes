'use strict';
function parseCSV(text) {
  const rows = []; let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if(c === '\r' && text[i+1] === '\n') i++; row.push(field); if(row.some(x => x.trim())) rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if(quoted) throw new Error('Unclosed CSV quote');
  row.push(field); if(row.some(x => x.trim())) rows.push(row);
  return rows;
}
function safeURL(value) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
if (typeof module !== 'undefined') module.exports = { parseCSV, safeURL, normalize };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let people = [], field = 'All', lastTrigger = null, loadVersion = 0;
  const dialog = $('profile');
  const el = (tag, className, text) => { const node = document.createElement(tag); if(className) node.className = className; if(text !== undefined) node.textContent = text; return node; };
  const slug = name => normalize(name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  function portrait(person) {
    const node = el('div', `portrait ${person.field.toLowerCase()}`);
    node.append(el('span','initials',person.name.split(/\s+/).map(n=>n[0]).slice(0,2).join('')));
    if(person.image) { const img = el('img'); img.alt = ''; img.src = person.image; img.loading = 'lazy'; img.addEventListener('error',()=>img.remove(),{once:true}); node.append(img); if(person.photoSource){const source=el('a','photo-credit','Photo: Wikipedia ↗');source.href=person.photoSource;source.target='_blank';source.rel='noopener noreferrer';node.append(source);} }
    return node;
  }
  async function enrichPhotos() {
    const candidates = people.filter(p=>!p.image).map(person=>({person,url:person.links.find(link=>new URL(link).hostname==='en.wikipedia.org')})).filter(x=>x.url);
    let next = 0;
    async function worker() { while(next<candidates.length) { const {person,url}=candidates[next++]; try { const title=decodeURIComponent(new URL(url).pathname.split('/wiki/')[1]); const response=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`); if(!response.ok)continue;const data=await response.json(); const image=safeURL(data.thumbnail?.source);if(image){person.image=image;person.photoSource=url; for(const card of $('grid').children){if(card.querySelector('h3')?.textContent===person.name)card.querySelector('.portrait').replaceWith(portrait(person));}} } catch { /* Photos are optional; keep the initials. */ } } }
    await Promise.all([worker(),worker(),worker()]);
  }
  function render() {
    const query = normalize($('search').value.trim());
    const visible = people.filter(p => (field === 'All' || p.field === field) && normalize(`${p.name} ${p.field}`).includes(query)).sort((a,b)=>a.name.localeCompare(b.name) * ($('sort').value === 'desc' ? -1 : 1));
    $('grid').replaceChildren();
    for(const person of visible) {
      const button = el('article','card');
      button.append(portrait(person)); const body = el('div','card-body'); body.append(el('span','tag',person.field),el('h3','',person.name));
      const bottom = el('div','card-bottom'); const open = el('button','profile-button','View profile'); open.type='button'; open.setAttribute('aria-label',`View ${person.name} profile`); open.addEventListener('click',()=>openProfile(person,open)); bottom.append(open); body.append(bottom); const quick = el('div','quick-links'); for(const url of person.links.slice(0,2)){const a=el('a','',new URL(url).hostname.replace(/^www\./,'')+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';quick.append(a);} if(!person.links.length)quick.append(el('span','','No links yet')); body.append(quick);button.append(body); $('grid').append(button);
    }
    $('resultCount').textContent = `Showing ${visible.length} of ${people.length} people`;
    $('empty').hidden = visible.length > 0; $('clear').hidden = !query && field === 'All';
    for(const button of $('filters').children) button.setAttribute('aria-pressed', String(button.textContent === field));
  }
  function openProfile(person, trigger, previewURL) {
    lastTrigger = trigger || null;
    $('profileContent').replaceChildren();
    const heading = el('div','profile-heading'); heading.append(portrait(person));
    const title = el('div'); title.append(el('span','tag',person.field)); const h = el('h2','',person.name); h.id = 'profileName'; title.append(h); heading.append(title); $('profileContent').append(heading);
    $('profileContent').append(el('p','profile-note',person.summary || 'Explore this community-supplied profile through the public links below.'));
    if(person.source) { const note = el('p','profile-note',`T1D source reviewed ${person.reviewed}. `); const source = el('a','','Read source ↗'); source.href = person.source; source.target = '_blank'; source.rel = 'noopener noreferrer'; note.append(source); $('profileContent').append(note); }
    const links = el('div','profile-links');
    for(const url of person.links) {
      const domain = new URL(url).hostname.replace(/^www\./,'');
      const row = el('div','source-row'); const read = el('button','read-here',`Read here: ${domain}`); read.type='button'; read.addEventListener('click',()=>showReader(url));
      const a = el('a','open-source','Open tab ↗'); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; a.setAttribute('aria-label',`Open ${domain} in a new tab`);
      row.append(read,a); links.append(row);
    }
    if(!person.links.length) links.append(el('p','profile-note','No public links have been added yet. Know a reliable source? Suggest a correction below.'));
    $('profileContent').append(links);
    const reader=el('section','embedded-reader'); reader.id='reader'; reader.hidden=true;
    const controls=el('div','reader-controls'); const label=el('strong','','Reading');label.id='readerLabel';
    const external=el('a','','Open this page in a new tab ↗');external.id='readerExternal';external.target='_blank';external.rel='noopener noreferrer';
    const hide=el('button','','Hide reader');hide.type='button';hide.addEventListener('click',()=>{reader.hidden=true;$('readerFrame').src='about:blank';dialog.classList.remove('reading');});
    controls.append(label,external,hide);reader.append(controls,el('p','reader-note','If the page is blank or says it refused to connect, this publisher blocks embedding. Use “Open this page in a new tab” above.'));
    const frame=el('iframe');frame.id='readerFrame';frame.title=`Embedded page for ${person.name}`;frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');reader.append(frame);$('profileContent').append(reader);
    $('correctProfile').href = `https://github.com/jtb21091/DiabeticAthletes/issues/new?title=${encodeURIComponent(`Profile correction: ${person.name}`)}&body=${encodeURIComponent('Suggested correction:\n\nSupporting public source:\n')}`;
    $('copyProfile').textContent = 'Copy profile link';
    history.replaceState(null,'',`#person=${slug(person.name)}`);
    if(!dialog.open) dialog.showModal();
    dialog.classList.remove('reading');
    if(previewURL || person.links.length) showReader(previewURL || person.links[0], false);
  }
  function showReader(url, scroll = true) {
    const safe=safeURL(url);if(!safe)return;
    $('reader').hidden=false;dialog.classList.add('reading');$('readerLabel').textContent=new URL(safe).hostname.replace(/^www\./,'');$('readerExternal').href=safe;$('readerFrame').src=safe;
    if(scroll)$('reader').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function fromHash() { if(location.hash.startsWith('#person=')) { const person = people.find(p=>slug(p.name) === location.hash.slice(8)); if(person) openProfile(person); } }
  function reset() { $('search').value=''; field='All'; render(); }
  async function load() {
    const version = ++loadVersion; $('error').hidden = true; $('empty').hidden = true; $('resultCount').textContent='Loading directory…';
    try {
      const responses = await Promise.all([fetch('T1Ds - Sheet1.csv'),fetch('profiles.json')]);
      if(responses.some(r=>!r.ok)) throw new Error('Directory request failed');
      const [csv, metadata] = await Promise.all([responses[0].text(),responses[1].json()]);
      if(version !== loadVersion) return;
      const rows = parseCSV(csv); if(rows[0]?.[0] !== 'Name') throw new Error('Unexpected CSV header');
      people = rows.slice(1).filter(row=>row[0]?.trim()).map(row=>{
        const name=row[0].trim(), details=metadata[name] || {};
        return {name,field:details.field || 'Other',image:safeURL(row[1]),links:[...new Set(row.slice(2).map(safeURL).filter(Boolean))],summary:details.summary,source:safeURL(details.source),reviewed:details.reviewed};
      });
      if(!people.length) throw new Error('Empty directory');
      const fields=[...new Set(people.map(p=>p.field))].sort(); $('peopleCount').textContent=people.length; $('fieldCount').textContent=fields.length; $('filters').replaceChildren();
      for(const name of ['All',...fields]) { const button=el('button','',name); button.type='button'; button.addEventListener('click',()=>{field=name;render();}); $('filters').append(button); }
      render(); fromHash(); enrichPhotos();
    } catch(error) { if(version !== loadVersion) return; console.error(error); $('grid').replaceChildren(); $('error').hidden=false; $('empty').hidden=true; $('resultCount').textContent='Directory unavailable'; }
  }
  $('search').addEventListener('input',render); $('sort').addEventListener('change',render); $('clear').addEventListener('click',reset); $('reset').addEventListener('click',reset); $('retry').addEventListener('click',load);
  $('closeProfile').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{ if(event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) dialog.close(); } });
  dialog.addEventListener('close',()=>{if($('readerFrame'))$('readerFrame').src='about:blank';dialog.classList.remove('reading');if(location.hash.startsWith('#person=')) history.replaceState(null,'','#directory'); if(lastTrigger?.isConnected) lastTrigger.focus();});
  $('copyProfile').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('copyProfile').textContent='Link copied';}catch{$('copyProfile').textContent='Copy the address above';}});
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#person=')) fromHash(); else if(dialog.open) dialog.close();});
  load();
}
