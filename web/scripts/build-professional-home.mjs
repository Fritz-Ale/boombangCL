/**
 * Professional public landing page. Uses the design-owned HTML template and
 * versioned milestones, so the deployed homepage cannot drift from the code.
 * This file intentionally contains no account forms, sessions or API calls.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { normalizeMilestones, milestoneKinds } from './build-milestones.mjs';

const templatePath=fileURLToPath(new URL('../pro-home.html',import.meta.url));
const escape=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function editorialArticles(roadmap) {
 return normalizeMilestones(roadmap).slice(0,3).map(item=>
  '<article><time datetime="'+escape(item.date)+'">'+escape(item.date)+'</time>'+
  '<span>'+escape(milestoneKinds[item.kind])+'</span>'+
  '<h3>'+escape(item.title)+'</h3>'+
  '<p>'+escape(item.description)+'</p>'+
  '<a href="noticias.html#hitos-reales">Leer actualización →</a></article>'
 ).join('');
}

export async function renderProfessionalHomepage(roadmap) {
 const tasks=roadmap?.phases?.flatMap(phase=>phase.tasks||[])||[];
 const done=tasks.filter(task=>task.status==='implemented').length;
 const pending=tasks.filter(task=>task.status==='pending').length;
 if(tasks.length!==20 || done!==11 || pending!==9)throw new Error('Review homepage task counter before release');
 const percent=Math.round(done/tasks.length*100);
 const source=await readFile(templatePath,'utf8');
 const values={
   TASKS_DONE:done,
   TASKS_TOTAL:tasks.length,
   TASKS_PENDING:pending,
   PERCENT:percent,
   RECENT_UPDATES:editorialArticles(roadmap),
 };
 const output=source.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{
   if(!(key in values))throw new Error('Unknown homepage placeholder: '+key);
   return String(values[key]);
 });
 if(/\{\{[A-Z_]+\}\}/.test(output))throw new Error('Unrendered homepage placeholder');
 if(!output.includes('id="principal"')||!output.includes('href="index.html"'))throw new Error('Invalid homepage navigation');
 if(/<form\b|type="password"|http:\/\/play\.boombang\.com|portal-app\.js/.test(output))throw new Error('Unsafe public homepage feature');
 return output;
}
