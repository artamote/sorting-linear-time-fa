import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {marked} from 'marked';
import katex from 'katex';
import {chromium} from 'playwright';

const root=path.dirname(fileURLToPath(import.meta.url));
const chapters=['00-intro.md','01-lower-bound.md','02-counting.md','03-radix.md','04-review.md'];
const escapeHtml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const nav=[];
let mathErrors=[];

function renderChapter(file,index){
  let src=fs.readFileSync(path.join(root,'chapters',file),'utf8');
  const math=[];
  src=src.replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g,(_,display,inline)=>{
    const tex=(display??inline).trim();
    const token=`MATHPLACEHOLDER${math.length}END`;
    try{math.push(katex.renderToString(tex,{displayMode:display!==undefined,throwOnError:true,output:'html'}));}
    catch(e){mathErrors.push(`${file}: ${tex}: ${e.message}`);math.push(`<code>${escapeHtml(tex)}</code>`);}
    return token;
  });
  let html=marked.parse(src,{gfm:true,breaks:false});
  html=html.replace(/MATHPLACEHOLDER(\d+)END/g,(_,i)=>math[Number(i)]);
  const title=src.match(/^# (.+)$/m)?.[1]??file;
  const id=`chapter-${index}`;
  nav.push({title,id,sub:false});
  let section=0;
  html=html.replace(/<h2>([\s\S]*?)<\/h2>/g,(_,heading)=>{
    section++;
    const subid=`${id}-section-${section}`;
    nav.push({title:heading.replace(/<[^>]*>/g,''),id:subid,sub:true});
    return `<h2 id="${subid}">${heading}</h2>`;
  });
  return `<section class="chapter" id="${id}"><span class="chapter-mark">${index===0?'راهنما':`بخش ${index}`}</span>${html}</section>`;
}

let content=chapters.map(renderChapter).join('\n');
if(mathErrors.length){console.error(mathErrors.join('\n'));process.exit(1)}
const toc=nav.map(x=>`<a class="${x.sub?'sub':''}" href="#${x.id}">${escapeHtml(x.title)}</a>`).join('\n');
const html=`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="جزوهٔ فارسی و خودآموز مرتب‌سازی در زمان خطی: کران پایین، Counting Sort و Radix Sort"><title>مرتب‌سازی در زمان خطی | جزوه الگوریتم</title><link rel="stylesheet" href="assets/katex.min.css"><link rel="stylesheet" href="assets/style.css"></head><body><div class="layout"><aside class="sidebar"><div class="brand">مرتب‌سازی در زمان خطی<small>جزوهٔ درس الگوریتم و ساختمان داده<br>بر اساس ۲۵ اسلاید Sorting.pdf</small></div><nav class="toc"><div class="toc-title">فهرست مطالب</div>${toc}</nav><div class="actions"><a href="guide.pdf">دریافت PDF</a><a href="https://github.com/artamote/sorting-linear-time-fa">فایل‌های منبع</a></div></aside><main class="book"><header class="hero"><div class="eyebrow">الگوریتم و ساختمان داده</div><h1>مرتب‌سازی در زمان خطی</h1><p>از کران پایینِ روش‌های مقایسه‌ای تا Counting Sort و Radix Sort</p><div class="meta"><span>فارسی و خودآموز</span><span>با اثبات و مثال حل‌شده</span><span>بر پایهٔ ۲۵ اسلاید</span></div></header>${content}<footer class="footer">منبع اصلی: Sorting.pdf، «Sorting in Linear Time» — توضیحات تکمیلی و اصلاح‌های آموزشی در متن مشخص شده‌اند.</footer></main></div></body></html>`;
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Built index.html');
if(process.argv.includes('--pdf')){
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1100,height:800},deviceScaleFactor:1});
  await page.goto('file://'+path.join(root,'index.html'),{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  await page.emulateMedia({media:'print'});
  await page.pdf({path:path.join(root,'guide.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true,outline:true});
  await browser.close();
  console.log('Built guide.pdf');
}
