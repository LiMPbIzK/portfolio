export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  archived: boolean;
  fork: boolean;
}

interface CachedRepos {
  fetchedAt: number;
  repos: GitHubRepo[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_PREFIX = 'github-repos';

export async function getRepos(username: string): Promise<GitHubRepo[]> {
  const cacheKey = `${CACHE_PREFIX}:${username}`;

  const cached = readCache(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
    { headers: { Accept: 'application/vnd.github+json' } }
  );

  if (!response.ok) {
    throw new Error(`GitHub API: ${response.status}`);
  }

  const repos = (await response.json()) as GitHubRepo[];
  writeCache(cacheKey, repos);
  return repos;
}

function readCache(key: string): GitHubRepo[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const data = JSON.parse(raw) as CachedRepos;
    if (Date.now() - data.fetchedAt > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return data.repos;
  } catch {
    return null;
  }
}

function writeCache(key: string, repos: GitHubRepo[]): void {
  try {
    const data: CachedRepos = { fetchedAt: Date.now(), repos };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    return;
  }
}
