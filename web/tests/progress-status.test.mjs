import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSnapshot, countIssueCheckboxes } from '../scripts/generate-progress-status.mjs';

test('count GitHub issue checkboxes without treating unchecked tasks as completed', () => {
  assert.deepEqual(countIssueCheckboxes('- [x] Completo\n- [ ] Falta\n- [X] Otro\nEsta línea no es una tarea'), {
    completed: 2, total: 3, pending: 1,
  });
});

test('safe deployment snapshot summarizes private GitHub data but never exposes secrets or issue body', async () => {
  const secret = 'private-access-token-do-not-show';
  const fetchImpl = async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer ' + secret);
    const data = url.includes('/pulls/1') ? {
      state:'open', draft:true, merged_at:null, changed_files:53, commits:100,
      body:'Sensitive user-supplied PR description', title:'Internal only',
    } : url.includes('/issues/2') ? {
      body:'- [x] Implementado\n- [ ] Pendiente\nContacto privado: interno@example.test',
    } : {
      workflow_runs:[{id:41259793492,status:'completed',conclusion:'success',head_commit:{message:'Secret PR title'}}],
    };
    return {ok:true,json: async () => data};
  };
  const snapshot = await buildSnapshot({
    repository:'Fritz-Ale/boombangCL',
    token:secret,
    fetchImpl,
    createdAt:'2026-10-31T22:00:00.000Z',
  });
  assert.equal(snapshot.origin,'github-actions-snapshot');
  assert.deepEqual(snapshot.issue, { completed:1,total:2,pending:1,url:'https://github.com/Fritz-Ale/boombangCL/issues/2' });
  assert.equal(snapshot.pullRequest.changedFiles,53);
  assert.equal(snapshot.checks.conclusion,'success');
  assert.equal(snapshot.checks.runId,41259793492);
  const json=JSON.stringify(snapshot);
  for(const forbidden of [secret,'interno@example.test','Sensitive user-supplied PR description','Secret PR title']) {
    assert.ok(!json.includes(forbidden),'Must not leak '+forbidden);
  }
});

test('GitHub status snapshot handles unavailable endpoints without fabricating success', async () => {
  const snapshot = await buildSnapshot({
    repository:'Fritz-Ale/boombangCL',
    token:'not-published',
    fetchImpl:async () => ({ok:false,status:403}),
  });
  assert.equal(snapshot.checks,null);
  assert.equal(snapshot.pullRequest,null);
  assert.equal(snapshot.issue,null);
});

test('GitHub status snapshot refuses missing token or invalid repository', async () => {
  await assert.rejects(buildSnapshot({repository:'Fritz-Ale/boombangCL',token:''}),/Missing token/);
  await assert.rejects(buildSnapshot({repository:'invalid/../repo',token:'test'}),/Invalid GitHub repository/);
});

test('GitHub Pages workflow includes isolated build, safe snapshot and daily schedule', () => {
  const workflow = readFileSync(resolve('web/tests/../../.github/workflows/pages-avances.yml'),'utf8');
  assert.match(workflow,/schedule:/);
  assert.match(workflow,/generate-progress-status\.mjs/);
  assert.match(workflow,/permissions:\s*\n\s*contents: read/);
  assert.match(workflow,/issues: read/);
  assert.match(workflow,/pull-requests: read/);
  assert.match(workflow,/actions: read/);
  assert.match(workflow,/\bpages: write/);
  assert.match(workflow,/ENABLE_PROGRESS_PAGES == 'true'/);
  assert.ok(!workflow.includes('web/cuenta.html'));
  assert.ok(!workflow.includes('api/.env'));
});
