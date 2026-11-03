/**
 * Produces a SAFE, read-only GitHub activity snapshot for static Pages.
 *
 * This file runs in GitHub Actions. GITHUB_TOKEN is used on the server runner
 * and is NEVER written to the public JSON or to the web frontend.
 * It intentionally omits private issue bodies, comments, user identities,
 * filenames, commit messages, branch source and GitHub environment secrets.
 */
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function countIssueCheckboxes(body = '') {
  const matches = [...String(body).matchAll(/^\s*-\s*\[([ xX])\]\s+\S/gm)];
  const completed = matches.filter(match => match[1].toLowerCase() === 'x').length;
  return { completed, total: matches.length, pending: matches.length - completed };
}

export async function buildSnapshot({
  repository,
  token,
  fetchImpl = fetch,
  createdAt = new Date().toISOString(),
} = {}) {
  if (!REPOSITORY_PATTERN.test(repository || '')) throw new Error('Invalid GitHub repository');
  if (!token) throw new Error('Missing token: read-only GitHub snapshot cannot be generated');

  const apiBase = 'https://api.github.com/repos/' + repository;
  async function read(path) {
    const response = await fetchImpl(apiBase + path, {
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) throw new Error('GitHub API HTTP ' + response.status);
    return response.json();
  }

  const outputs = await Promise.allSettled([
    read('/pulls/1'),
    read('/issues/2'),
    read('/actions/workflows/portal-checks.yml/runs?per_page=3'),
  ]);
  const [pr, issue, runs] = outputs.map(entry => entry.status === 'fulfilled' ? entry.value : null);

  const issueCounts = issue ? countIssueCheckboxes(issue.body || '') : null;
  const latestRun = Array.isArray(runs?.workflow_runs) ? runs.workflow_runs[0] : null;
  const safePrState = ['open', 'closed'].includes(pr?.state) ? pr.state : 'unknown';
  const safeRunStatus = ['queued', 'in_progress', 'completed', 'waiting', 'pending', 'requested'].includes(latestRun?.status)
    ? latestRun.status : 'unknown';
  const safeConclusion = ['success', 'failure', 'cancelled', 'skipped', 'timed_out', 'action_required', 'neutral'].includes(latestRun?.conclusion)
    ? latestRun.conclusion : null;

  // The only URLs exposed are canonical, preselected GitHub destinations.
  return {
    version: 1,
    generatedAt: createdAt,
    origin: 'github-actions-snapshot',
    note: 'Fotografía al desplegar GitHub Pages. No es consulta en tiempo real.',
    pullRequest: pr ? {
      state: safePrState,
      draft: Boolean(pr.draft),
      merged: Boolean(pr.merged_at),
      commits: Number.isSafeInteger(pr.commits) ? pr.commits : null,
      changedFiles: Number.isSafeInteger(pr.changed_files) ? pr.changed_files : null,
      url: 'https://github.com/' + repository + '/pull/1',
    } : null,
    checks: latestRun ? {
      status: safeRunStatus,
      conclusion: safeConclusion,
      runId: Number.isSafeInteger(latestRun.id) ? latestRun.id : null,
      url: 'https://github.com/' + repository + '/actions',
    } : null,
    issue: issueCounts ? {
      ...issueCounts,
      url: 'https://github.com/' + repository + '/issues/2',
    } : null,
  };
}

async function main() {
  const filename = process.argv[2];
  if (!filename) throw new Error('Usage: node generate-progress-status.mjs <output.json>');
  const snapshot = await buildSnapshot({
    repository: process.env.GITHUB_REPOSITORY,
    token: process.env.PROGRESS_GITHUB_TOKEN,
  });
  await writeFile(filename, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  console.log('Prepared privacy-safe progress snapshot (never contains an API token).');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error('Cannot build progress snapshot:', error.message);
    process.exitCode = 1;
  });
}
