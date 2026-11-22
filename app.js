const countryOptions=['All Countries','United States','United Kingdom','Canada','Australia','India','Sri Lanka','Japan','Germany','France','Brazil','Mexico','United Arab Emirates','South Africa','New Zealand','International'];
function detectCountry(textValue=''){
 const t=String(textValue).toLowerCase();
 const rules=[
  ['United States',/\b(united states|u\.s\.|usa|america|american|washington dc|new york|california|texas)\b/],
  ['United Kingdom',/\b(united kingdom|uk|britain|british|england|scotland|wales|london)\b/],
  ['Canada',/\b(canada|canadian|toronto|ottawa|vancouver)\b/],
  ['Australia',/\b(australia|australian|sydney|melbourne|canberra)\b/],
  ['India',/\b(india|indian|new delhi|mumbai|manipur)\b/],
  ['Sri Lanka',/\b(sri lanka|sri lankan|colombo)\b/],
  ['Japan',/\b(japan|japanese|tokyo)\b/],
  ['Germany',/\b(germany|german|berlin)\b/],
  ['France',/\b(france|french|paris)\b/],
  ['Brazil',/\b(brazil|brazilian)\b/],
  ['Mexico',/\b(mexico|mexican)\b/],
  ['United Arab Emirates',/\b(united arab emirates|uae|dubai|abu dhabi)\b/],
  ['South Africa',/\b(south africa|south african|johannesburg)\b/],
  ['New Zealand',/\b(new zealand|kiwi)\b/]
 ];
 for(const [name,re] of rules)if(re.test(t))return name;
 return 'International';
}
\nconst categories=['All','Politics','Technology','Business','Science','Crime','Lifestyle','Sports','Celebrity','Movies','TV Series','Music'];
let stories=[],activeView='news',selectedStory=null,fbText='',pinTitle='',pinDescription='',pinTags='',uploadedPhoto=null,uploadedPhotoUrl='',imagePlacement={facebook:{x:0,y:0,zoom:1},pinterest:{x:0,y:0,zoom:1}};
const $=s=>document.querySelector(s),root=$('#viewRoot');
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeUrl(v=''){try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2300)}
function setView(v){activeView=v;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('#breadcrumb').textContent=v==='news'?'News Feed':'Create Posts';$('#pageTitle').innerHTML=v==='news'?'Choose a story. <em>Create your posts.</em>':'Prepare your <em>social posts.</em>';$('#pageSub').textContent=v==='news'?'Fresh headlines from AP, Reuters and CNN. Pick a story to prepare Facebook and Pinterest content.':'One story, two platform-ready posts and two branded thumbnails.';render()}
function render(){if(activeView==='news')renderNews();else renderCreate()}
function renderNews(){
 root.innerHTML='<div class="section-heading"><div><h2>Breaking News Picker</h2><p class="feed-note">Choose a country, review the latest headlines, then pick a story to create a Breaking News post.</p></div><span class="status-badge">'+stories.length+' stories</span></div>'+
 '<section class="breaking-picker"><div class="breaking-picker-head"><div><span class="breaking-kicker">NOVA DAILY · LIVE NEWS DESK</span><h3>Pick a breaking news story</h3><p class="feed-note">Select a country to show matching headlines.</p></div><div class="breaking-picker-controls"><label for="countryNews">COUNTRY</label><select class="filter-select country-filter" id="countryNews">'+countryOptions.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('')+'</select></div><span class="breaking-pulse">● NEWS PICKER</span></div><div class="breaking-list" id="breakingList"></div></section>'+
 '<div class="section-heading"><h2>Latest news</h2><span class="status-badge" id="filteredCount">'+stories.length+' stories</span></div><div class="filters"><input class="search-box" id="searchNews" placeholder="Search headlines…"><select class="filter-select" id="categoryNews">'+categories.map(c=>'<option>'+c+'</option>').join('')+'</select></div><div class="news-grid" id="newsGrid">'+storyCards(stories)+'</div><p class="feed-note">Country results use country-specific RSS editions and story location mentions. Open the original report to verify details before publishing.</p>';
 $('#searchNews').addEventListener('input',filterNews);$('#categoryNews').addEventListener('change',filterNews);$('#countryNews').addEventListener('change',filterNews);filterNews();
}
function storyCards(list){return list.length?list.map(s=>'<article class="news-card"><div class="card-art '+(s.image_url?'has-image':'')+'">'+(s.image_url?'<img class="card-thumbnail" src="'+esc(s.image_url)+'" alt="" loading="lazy">':'')+'<span class="art-kicker">NOVA DAILY / '+esc(s.category)+'</span><div class="art-label">'+esc(s.category)+'</div></div><div class="card-body"><div class="meta">'+esc(s.source)+' · '+esc(s.time)+'</div><h3>'+esc(s.title)+'</h3><p>'+esc(s.summary)+'</p><div class="card-footer"><a class="source-link" href="'+esc(s.url||'#')+'" target="_blank" rel="noopener">Original source ↗</a><button class="small-action" data-create="'+esc(s.id)+'">Create posts →</button></div></div></article>').join(''):'<div class="empty-state">No news found. Try another category or refresh the feed.</div>'}
function filterNews(){
 const q=$('#searchNews').value.toLowerCase(),cat=$('#categoryNews').value,country=$('#countryNews').value;
 const matches=stories.filter(s=>(country==='All Countries'||s.country===country)&&(cat==='All'||s.category===cat)&&(s.title+' '+s.summary+' '+s.source).toLowerCase().includes(q));
 $('#newsGrid').innerHTML=storyCards(matches);$('#filteredCount').textContent=matches.length+' stories';
 const breaking=matches.slice(0,12);
 $('#breakingList').innerHTML=breaking.length?breaking.map(s=>'<article class="breaking-row"><div class="breaking-row-copy"><span class="breaking-meta">'+esc(s.country||'International')+' · '+esc(s.source)+' · '+esc(s.time)+'</span><strong>'+esc(s.title)+'</strong></div><button class="breaking-pick" data-breaking="'+esc(s.id)+'">Pick this story ↗</button></article>').join(''):'<div class="empty-state">No stories for this country yet. Try another country or refresh the feed.</div>';
}
function renderCreate(){if(!selectedStory){root.innerHTML='<div class="empty-state">Choose a story from the News Feed to create its Facebook and Pinterest posts.<br><br><button class="button button-primary" data-goto="news">Browse news</button></div>';return}
const s=selectedStory;
root.innerHTML='<div class="selected-story"><div><span class="eyebrow">'+esc(s.category)+' · '+esc(s.source)+'</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.summary)+'</p></div><a href="'+esc(s.url||'#')+'" target="_blank" rel="noopener">Read source ↗</a></div><div class="studio-grid"><section class="tool-card"><div class="platform-head"><h3>Facebook post</h3><span class="platform-size">Short news · 2–3 paragraphs</span></div><div class="field"><label>HEADLINE</label><input id="fbHeadline" value="'+esc(s.title)+'"></div><div class="field"><label>NEWS POST</label><textarea id="fbBody" rows="8">'+esc(makeFb(s))+'</textarea></div><div class="field"><label>HASHTAGS</label><input id="fbTags" value="#NovaDaily #USNews #LatestNews"></div><button class="button button-primary" id="copyFb">Copy Facebook post</button></section><section class="tool-card"><div class="platform-head"><h3>Pinterest pin</h3><span class="platform-size">SEO title + description</span></div><div class="field"><label>PIN TITLE</label><input id="pinTitle" value="'+esc(s.title+' | NOVA DAILY')+'"></div><div class="field"><label>DESCRIPTION</label><textarea id="pinDescription" rows="5">'+esc(makePin(s))+'</textarea></div><div class="field"><label>KEYWORDS / TAGS</label><input id="pinTags" value="'+esc('USA News, '+s.category+', Latest News, NOVA DAILY')+'"></div><div class="field"><label>FACEBOOK POST LINK (ADD AFTER PUBLISHING)</label><input id="fbLink" placeholder="Paste your Facebook post URL here"></div><button class="button button-primary" id="copyPin">Copy Pinterest content</button></section></div><div class="section-heading poster-heading"><h2>Branded thumbnails</h2><span class="status-badge">Two different layouts</span></div><div class="poster-grid"><section class="tool-card poster-card"><div class="platform-head"><h3>Facebook · 2:3</h3><span class="platform-size">1080 × 1620</span></div><canvas id="fbCanvas" width="1080" height="1620"></canvas><button class="button button-primary" id="downloadFb">Download Facebook image</button></section><section class="tool-card poster-card"><div class="platform-head"><h3>Pinterest · 4:5</h3><span class="platform-size">1080 × 1350</span></div><canvas id="pinCanvas" width="1080" height="1350"></canvas><button class="button button-primary" id="downloadPin">Download Pinterest image</button></section></div><p class="feed-note">The posters use the story thumbnail when the image host allows it. Otherwise a branded graphic background is used. Always check the image and headline match before publishing.</p>';
['fbHeadline','fbBody','fbTags','pinTitle','pinDescription','pinTags','fbLink'].forEach(id=>$('#'+id).addEventListener('input',()=>{if(id==='fbHeadline'||id==='fbBody')drawPosters()}));
$('#copyFb').onclick=()=>copy([$('#fbHeadline').value,$('#fbBody').value,$('#fbTags').value,'Source: '+(s.url||'')].join('\n\n'));
$('#copyPin').onclick=()=>copy([$('#pinTitle').value,$('#pinDescription').value,$('#pinTags').value,'Facebook: '+$('#fbLink').value].join('\n\n'));
drawPosters();enableImageDrag($('#fbCanvas'),'facebook');enableImageDrag($('#pinCanvas'),'pinterest');$('#downloadFb').onclick=()=>downloadCanvas('fbCanvas','nova-daily-facebook-2x3.png');$('#downloadPin').onclick=()=>downloadCanvas('pinCanvas','nova-daily-pinterest-4x5.png');
}
function makeFb(s){return s.summary+'\n\nRead the original report for more details and the latest updates. NOVA DAILY will continue following this story.'}
function makePin(s){return 'Stay informed about '+s.category.toLowerCase()+' news in the United States. '+s.summary+' Read the full update on NOVA DAILY and visit the original reporting for more details.'}
function drawPosters(){const s=selectedStory;if(!s)return;drawPoster($('#fbCanvas'),s,'facebook');drawPoster($('#pinCanvas'),s,'pinterest')}
function drawPoster(c,s,type){
 const ctx=c.getContext('2d'),w=c.width,h=c.height;
 const paint=(photo)=>{
  ctx.clearRect(0,0,w,h);
  const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#14233d');g.addColorStop(.55,'#111722');g.addColorStop(1,'#05080e');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const photoHeight=h*(type==='facebook'?.56:.60);
  if(photo){
   const scale=Math.max(w/photo.width,photoHeight/photo.height),iw=photo.width*scale,ih=photo.height*scale;
   ctx.save();ctx.beginPath();ctx.rect(0,0,w,photoHeight);ctx.clip();ctx.drawImage(photo,(w-iw)/2,(photoHeight-ih)/2,iw,ih);ctx.restore();
   const shade=ctx.createLinearGradient(0,0,0,photoHeight);shade.addColorStop(0,'#06102066');shade.addColorStop(.55,'#06102022');shade.addColorStop(1,'#061020f2');ctx.fillStyle=shade;ctx.fillRect(0,0,w,photoHeight);
  }
  ctx.fillStyle='#e31d2b';ctx.fillRect(0,0,w,Math.round(h*.018));
  ctx.fillStyle='#fff';ctx.font='bold '+Math.round(w*.075)+'px Arial';ctx.fillText('NOVA',w*.07,h*.105);
  ctx.fillStyle='#ffd21a';ctx.font='bold '+Math.round(w*.055)+'px Arial';ctx.fillText('DAILY',w*.07,h*.15);
  ctx.fillStyle='#e31d2b';ctx.fillRect(w*.07,h*.19,w*.23,h*.009);
  ctx.fillStyle='#f5c400';ctx.font='bold '+Math.round(w*.035)+'px Arial';ctx.fillText(s.category.toUpperCase()+' / USA NEWS',w*.07,h*.25);
  const title=$('#fbHeadline')?.value||s.title;
  ctx.fillStyle='#fff';ctx.font='900 '+Math.round(w*(type==='facebook'?.064:.068))+'px Arial';
  wrap(ctx,title,w*.07,h*(type==='facebook'?.65:.68),w*.86,Math.round(w*.078),type==='facebook'?5:6);
  ctx.fillStyle='#f5c400';ctx.fillRect(w*.07,h*(type==='facebook'?.83:.84),w*.86,h*.006);
  ctx.fillStyle='#fff';ctx.font='bold '+Math.round(w*.034)+'px Arial';
  ctx.fillText(type==='facebook'?'LATEST UPDATE':'READ THE FULL STORY',w*.07,h*.89);
  ctx.font='500 '+Math.round(w*.025)+'px Arial';ctx.fillStyle='#c7d0df';
  ctx.fillText('AMERICA. INFORMED. EVERY DAY.',w*.07,h*.92);
  ctx.fillStyle='#e31d2b';ctx.fillRect(0,h*.95,w,h*.05);
  ctx.fillStyle='#fff';ctx.font='bold '+Math.round(w*.04)+'px Arial';ctx.fillText('NOVA DAILY',w*.07,h*.985);
 };
 if(s.image_url){const img=new Image();img.crossOrigin='anonymous';img.onload=()=>paint(img);img.onerror=()=>paint(null);img.src=s.image_url;}else paint(null);
}
function wrap(ctx,t,x,y,max,lineHeight,maxLines){let words=t.split(/\s+/),line='',n=0;for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>max&&line){ctx.fillText(line,x,y);line=word;y+=lineHeight;n++;if(n>=maxLines-1)break}else line=test}if(n<maxLines){if(ctx.measureText(line).width>max){while(line&&ctx.measureText(line+'…').width>max)line=line.slice(0,-1);line+='…'}ctx.fillText(line,x,y)}}
function downloadCanvas(id,name){const c=$('#'+id),a=document.createElement('a');a.download=name;a.href=c.toDataURL('image/png');a.click();toast('Image download started')}
function copy(t){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(t).then(()=>toast('Copied to clipboard')).catch(()=>fallbackCopy(t));else fallbackCopy(t)}
function fallbackCopy(t){const e=document.createElement('textarea');e.value=t;document.body.append(e);e.select();document.execCommand('copy');e.remove();toast('Copied to clipboard')}
async function loadNews(){try{const r=await fetch('./news.json?updated='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('News feed unavailable');const data=await r.json();if(!Array.isArray(data))throw Error('Invalid news feed');stories=data.map(x=>({id:x.id,title:x.title,summary:x.summary||'Open the original report for details.',category:x.category||'USA News',country:x.country||detectCountry((x.title||'')+' '+(x.summary||'')),source:x.source||'News source',url:x.url||'',image_url:safeUrl(x.image_url||''),time:x.published_at?new Date(x.published_at).toLocaleString():'Recently added'}));const status=document.querySelector('.update-status');if(status)status.innerHTML='<i></i> RSS news · ready';render()}catch(e){console.warn(e);const status=document.querySelector('.update-status');if(status)status.innerHTML='<i></i> News feed unavailable';root.innerHTML='<div class="empty-state">Could not load news.json yet. Check the GitHub Actions news collection workflow, then refresh this page.</div>'}}
document.addEventListener('click',e=>{const urgent=e.target.closest('[data-breaking]');if(urgent){const found=stories.find(s=>s.id===urgent.dataset.breaking);if(found){selectedStory={...found,isBreaking:true};setView('create')}return}const b=e.target.closest('[data-create]');if(b){selectedStory=stories.find(s=>s.id===b.dataset.create);setView('create');return}const g=e.target.closest('[data-goto]');if(g)setView(g.dataset.goto)});
document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.addEventListener('click',()=>{setView(b.dataset.view);$('#sidebar').classList.remove('open')}));
$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');$('#refreshBtn').onclick=loadNews;$('#refreshBtnMain').onclick=loadNews;
render();loadNews();


function makeImagePrompt(story){
 return 'Create a photorealistic editorial news photograph for NOVA DAILY. STORY: '+story.title+'. CATEGORY: '+story.category+'. CONTEXT: '+story.summary+'. Show a realistic scene that directly illustrates this specific story, in credible documentary photojournalism style, natural lighting, professional camera quality, strong clear subject, premium American news-media look. Portrait 4:5 composition, with clean negative space in the lower third for an accurate headline overlay. Dramatic but believable, not sensationalized. Do not invent identifiable people, logos, official seals, readable signs, words, captions, watermarks, dates, statistics or extra facts. No text in image. Create only the background photograph; NOVA DAILY will add the headline and branding separately. Pinterest version will be adapted to 2:3.';
}
function templateForStory(story){
 const cat=(story.category||'').toLowerCase(),title=(story.title||'').toLowerCase();
 if(/breaking|urgent|developing/.test(cat+' '+title))return 'breaking';
 if(/sport|football|basketball|baseball/.test(cat))return 'sports';
 if(/technology|tech|science|ai/.test(cat))return 'technology';
 if(/business|economy|market|finance/.test(cat))return 'economy';
 return 'world';
}
function renderCreate(){
 if(!selectedStory){root.innerHTML='<div class="empty-state">Choose a story from News Feed first.<br><br><button class="button button-primary" data-goto="news">Browse news</button></div>';return}
 const s=selectedStory;
 const options=[['auto','Auto — match news category'],['sports','01 · Sports News'],['breaking','02 · Breaking News'],['technology','03 · Technology News'],['world','04 · World News'],['economy','05 · Economy & Business']];
 const optionHtml=options.map(o=>'<option value="'+o[0]+'">'+o[1]+'</option>').join('');
 root.innerHTML='<div class="selected-story"><div><span class="eyebrow">'+esc(s.category)+' · '+esc(s.source)+'</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.summary)+'</p></div><a href="'+esc(s.url||'#')+'" target="_blank" rel="noopener">Read source ↗</a></div>'+
 '<div class="studio-grid"><section class="tool-card"><div class="platform-head"><h3>Facebook post</h3><span class="platform-size">2–3 paragraphs</span></div><div class="field"><label>HEADLINE — EDITABLE</label><input id="fbHeadline" value="'+esc(s.title)+'"></div><div class="field"><label>NEWS POST — EDITABLE</label><textarea id="fbBody" rows="8">'+esc(makeFb(s))+'</textarea></div><div class="field"><label>HASHTAGS</label><input id="fbTags" value="#NovaDaily #USNews #LatestNews"></div><button class="button button-primary" id="copyFb">Copy Facebook post</button>'+
 '<div class="embedded-thumbnail"><div class="platform-head"><h3>Facebook thumbnail</h3><span class="platform-size">3:4 · 1080 × 1440</span></div><div class="field"><label>THUMBNAIL HEADLINE</label><input id="fbImageHeadline" value="'+esc(s.title)+'"></div><canvas id="fbCanvas" width="1080" height="1440" aria-label="Facebook thumbnail preview"></canvas><button class="button" id="resetFbImage">Reset photo position</button><button class="button button-primary" id="downloadFb">Download Facebook thumbnail</button></div></section>'+
 '<section class="tool-card"><div class="platform-head"><h3>Pinterest pin</h3><span class="platform-size">SEO content</span></div><div class="field"><label>PIN TITLE — EDITABLE</label><input id="pinTitle" value="'+esc(s.title+' | NOVA DAILY')+'"></div><div class="field"><label>DESCRIPTION — EDITABLE</label><textarea id="pinDescription" rows="5">'+esc(makePin(s))+'</textarea></div><div class="field"><label>KEYWORDS / TAGS</label><input id="pinTags" value="'+esc('USA News, '+s.category+', Latest News, NOVA DAILY')+'"></div><div class="field"><label>FACEBOOK POST LINK</label><input id="fbLink" placeholder="Paste Facebook post URL after publishing"></div><button class="button button-primary" id="copyPin">Copy Pinterest content</button>'+
 '<div class="embedded-thumbnail"><div class="platform-head"><h3>Pinterest thumbnail</h3><span class="platform-size">2:3 · 1080 × 1620</span></div><div class="field"><label>THUMBNAIL HEADLINE</label><input id="pinImageHeadline" value="'+esc(s.title)+'"></div><canvas id="pinCanvas" width="1080" height="1620" aria-label="Pinterest thumbnail preview"></canvas><button class="button" id="resetPinImage">Reset photo position</button><button class="button button-primary" id="downloadPin">Download Pinterest thumbnail</button></div></section></div>'+
 '<section class="tool-card template-controls"><div class="platform-head"><div><h3>Thumbnail design templates</h3><p class="feed-note">Choose one of five branded layouts. Auto selects a template based on the news category.</p></div><span class="status-badge">5 NOVA DAILY designs</span></div><div class="field"><label>SELECT THUMBNAIL TEMPLATE</label><select id="templateSelect">'+optionHtml+'</select></div><div class="image-actions"><label class="button upload-button" for="imageUpload">↑ Upload / replace photo</label><input id="imageUpload" type="file" accept="image/*" hidden><button class="button" id="copyImagePrompt">Copy image prompt</button><button class="button" id="clearImage">Remove uploaded photo</button></div><div class="field"><label>STORY-SPECIFIC IMAGE PROMPT</label><textarea id="imagePrompt" rows="4" readonly>'+esc(makeImagePrompt(s))+'</textarea></div><p class="editor-hint">Upload a clean news photo, then drag it inside either preview to reposition. Scroll over a preview to zoom. Headline areas are kept separate from the photo to prevent text overlap.</p></section>'+
 '<p class="feed-note">The selected template is used for both platforms, with each thumbnail automatically composed to its correct aspect ratio. Check the headline and image before publishing.</p>';
 $('#templateSelect').value='auto';
 $('#copyFb').onclick=()=>copy([$('#fbHeadline').value,$('#fbBody').value,$('#fbTags').value,'Source: '+(s.url||'')].join('\n\n'));
 $('#copyPin').onclick=()=>copy([$('#pinTitle').value,$('#pinDescription').value,$('#pinTags').value,'Facebook: '+$('#fbLink').value].join('\n\n'));
 $('#copyImagePrompt').onclick=()=>copy(makeImagePrompt(s));
 $('#imageUpload').onchange=e=>{const file=e.target.files&&e.target.files[0];if(!file)return;if(!file.type.startsWith('image/')){toast('Please choose an image file');return}if(uploadedPhotoUrl)URL.revokeObjectURL(uploadedPhotoUrl);uploadedPhotoUrl=URL.createObjectURL(file);const img=new Image();img.onload=()=>{uploadedPhoto=img;imagePlacement={facebook:{x:0,y:0,zoom:1},pinterest:{x:0,y:0,zoom:1}};drawPosters();toast('Photo uploaded — both thumbnails updated')};img.onerror=()=>toast('Could not open image');img.src=uploadedPhotoUrl};
 $('#clearImage').onclick=()=>{if(uploadedPhotoUrl)URL.revokeObjectURL(uploadedPhotoUrl);uploadedPhoto=null;uploadedPhotoUrl='';$('#imageUpload').value='';drawPosters();toast('Uploaded photo removed')};
 ['fbImageHeadline','pinImageHeadline'].forEach(id=>$('#'+id).addEventListener('input',drawPosters));
 $('#fbHeadline').addEventListener('input',()=>{if($('#fbImageHeadline'))$('#fbImageHeadline').value=$('#fbHeadline').value;drawPosters()});
 $('#templateSelect').addEventListener('change',drawPosters);
 drawPosters();enableImageDrag($('#fbCanvas'),'facebook');enableImageDrag($('#pinCanvas'),'pinterest');
 $('#resetFbImage').onclick=()=>{imagePlacement.facebook={x:0,y:0,zoom:1};drawPosters();toast('Facebook photo position reset')};
 $('#resetPinImage').onclick=()=>{imagePlacement.pinterest={x:0,y:0,zoom:1};drawPosters();toast('Pinterest photo position reset')};
 $('#downloadFb').onclick=()=>downloadCanvas('fbCanvas','nova-daily-facebook-3x4.png');
 $('#downloadPin').onclick=()=>downloadCanvas('pinCanvas','nova-daily-pinterest-2x3.png');
}
function drawPosters(){if(!selectedStory)return;drawPoster($('#fbCanvas'),selectedStory,'facebook');drawPoster($('#pinCanvas'),selectedStory,'pinterest')}
function drawPoster(c,story,type){
 const ctx=c.getContext('2d'),w=c.width,h=c.height,photo=uploadedPhoto,place=imagePlacement[type];
 const selected=$('#templateSelect')?.value||'auto',template=selected==='auto'?templateForStory(story):selected;
 const styles={sports:{base:'#101522',accent:'#ffd21a',red:'#e31d2b'},breaking:{base:'#080d18',accent:'#ffd21a',red:'#e31d2b'},technology:{base:'#071a2b',accent:'#40d9ff',red:'#e31d2b'},world:{base:'#101b31',accent:'#ffd21a',red:'#e31d2b'},economy:{base:'#17170f',accent:'#ffd21a',red:'#e31d2b'}};
 const st=styles[template]||styles.world;
 // Locked geometry: masthead 0-19%, category 19-23.5%, photo 23.5-62%, headline 63.5-92%, footer 93-100%.
 const photoTop=h*.235,photoH=h*.385,panelY=h*.635,panelH=h*.285;
 ctx.clearRect(0,0,w,h);ctx.fillStyle=st.base;ctx.fillRect(0,0,w,h);
 ctx.fillStyle=st.red;ctx.fillRect(0,0,w,h*.19);
 ctx.fillStyle='#fff';ctx.font='900 '+Math.round(w*.075)+'px Arial';ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillText('NOVA',w*.06,h*.085);
 ctx.fillStyle=st.accent;ctx.font='900 '+Math.round(w*.052)+'px Arial';ctx.fillText('DAILY',w*.06,h*.15);
 ctx.fillStyle='#fff';ctx.globalAlpha=.85;ctx.font='bold '+Math.round(w*.024)+'px Arial';ctx.fillText('NEWS • WORLD • DAILY',w*.49,h*.125);ctx.globalAlpha=1;
 ctx.fillStyle=st.accent;ctx.fillRect(0,h*.19,w,h*.045);
 ctx.fillStyle='#111';ctx.font='900 '+Math.round(w*.031)+'px Arial';
 const category=template==='breaking'?'BREAKING NEWS':(story.category||'LATEST NEWS').toUpperCase();ctx.fillText(category.slice(0,38),w*.06,h*.221);
 ctx.fillStyle='#172235';ctx.fillRect(0,photoTop,w,photoH);
 if(photo){
  const scale=Math.max(w/photo.width,photoH/photo.height)*place.zoom,iw=photo.width*scale,ih=photo.height*scale;
  ctx.save();ctx.beginPath();ctx.rect(0,photoTop,w,photoH);ctx.clip();ctx.drawImage(photo,(w-iw)/2+place.x*w,photoTop+(photoH-ih)/2+place.y*photoH,iw,ih);ctx.restore();
  const shade=ctx.createLinearGradient(0,photoTop,0,photoTop+photoH);shade.addColorStop(0,'#06102010');shade.addColorStop(1,'#06102055');ctx.fillStyle=shade;ctx.fillRect(0,photoTop,w,photoH);
 }else{
  const g=ctx.createLinearGradient(0,photoTop,w,photoTop+photoH);g.addColorStop(0,st.red);g.addColorStop(1,st.base);ctx.fillStyle=g;ctx.fillRect(0,photoTop,w,photoH);
  ctx.fillStyle=st.accent;ctx.globalAlpha=.18;ctx.font='900 '+Math.round(w*.12)+'px Arial';ctx.fillText(template==='sports'?'SPORTS':template==='technology'?'TECH':template==='economy'?'MARKETS':template==='breaking'?'ALERT':'WORLD',w*.06,photoTop+photoH*.58);ctx.globalAlpha=1;
 }
 ctx.fillStyle=template==='breaking'?st.red:'#090c12';ctx.fillRect(0,panelY,w,panelH);
 ctx.fillStyle=st.accent;ctx.fillRect(w*.06,panelY+h*.025,w*.88,h*.006);
 const id=type==='facebook'?'fbImageHeadline':'pinImageHeadline',headline=($('#'+id)?.value||story.title||'LATEST NEWS').trim();
 const maxW=w*.88,maxH=panelH-h*.075;let fontSize=Math.round(w*.067),lines=[];
 ctx.textAlign='left';ctx.textBaseline='top';
 while(fontSize>=Math.round(w*.025)){
  ctx.font='900 '+fontSize+'px Arial';lines=[];let line='';
  for(const word of headline.split(/\s+/)){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>maxW&&line){lines.push(line);line=word}else line=candidate}
  if(line)lines.push(line);if(lines.length*fontSize*1.12<=maxH)break;fontSize-=Math.max(1,Math.round(w*.002));
 }
 ctx.font='900 '+fontSize+'px Arial';ctx.fillStyle='#fff';
 const lineH=fontSize*1.12,maxLines=Math.max(1,Math.floor(maxH/lineH));
 if(lines.length>maxLines){lines=lines.slice(0,maxLines);let last=lines[maxLines-1];while(last.length&&ctx.measureText(last+'…').width>maxW)last=last.slice(0,-1);lines[maxLines-1]=last+'…'}
 lines.forEach((line,i)=>ctx.fillText(line,w*.06,panelY+h*.065+i*lineH,maxW));
 ctx.fillStyle=st.red;ctx.fillRect(0,h*.93,w,h*.07);
 ctx.fillStyle='#fff';ctx.font='900 '+Math.round(w*.033)+'px Arial';ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillText((story.source||'NEWS DESK').toUpperCase().slice(0,22),w*.06,h*.965);
 ctx.textAlign='right';ctx.fillText('NOVA DAILY',w*.94,h*.965);ctx.textAlign='left';
}
function enableImageDrag(canvas,type){
 let active=false,lastX=0,lastY=0;canvas.style.touchAction='none';canvas.style.cursor='grab';
 canvas.addEventListener('pointerdown',e=>{if(!uploadedPhoto)return;active=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing'});
 canvas.addEventListener('pointermove',e=>{if(!active||!uploadedPhoto)return;const rect=canvas.getBoundingClientRect(),p=imagePlacement[type];p.x+=(e.clientX-lastX)/rect.width;p.y+=(e.clientY-lastY)/rect.height/.385;const w=canvas.width,h=canvas.height,photoH=h*.385,scale=Math.max(w/uploadedPhoto.width,photoH/uploadedPhoto.height)*p.zoom,iw=uploadedPhoto.width*scale,ih=uploadedPhoto.height*scale;p.x=Math.max(-Math.max(0,(iw-w)/(2*w)),Math.min(Math.max(0,(iw-w)/(2*w)),p.x));p.y=Math.max(-Math.max(0,(ih-photoH)/(2*photoH)),Math.min(Math.max(0,(ih-photoH)/(2*photoH)),p.y));lastX=e.clientX;lastY=e.clientY;drawPosters()});
 const stop=()=>{active=false;canvas.style.cursor='grab'};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
 canvas.addEventListener('wheel',e=>{if(!uploadedPhoto)return;e.preventDefault();const p=imagePlacement[type];p.zoom=Math.max(1,Math.min(3,p.zoom+(e.deltaY<0?.05:-.05)));drawPosters()},{passive:false});
}
