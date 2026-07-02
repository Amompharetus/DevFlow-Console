import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';

export async function scanWorkspace(baseDir) {
  const repos = [];
  try {
    const files = await fs.promises.readdir(baseDir, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isDirectory()) {
        const repoPath = path.join(baseDir, file.name);
        const gitPath = path.join(repoPath, '.git');
        
        if (fs.existsSync(gitPath)) {
          const git = simpleGit(repoPath);
          try {
            const isRepo = await git.checkIsRepo();
            if (isRepo) {
              const status = await git.status();
              const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
              
              repos.push({
                name: file.name,
                path: repoPath,
                branch: branch.trim(),
                modified: status.modified.length,
                created: status.not_added.length,
                deleted: status.deleted.length,
                ahead: status.ahead,
                behind: status.behind,
                isClean: status.isClean()
              });
            }
          } catch (e) {
            // Ignore subdirectories that failed checkIsRepo to prevent crashing the scanning loop
          }
        }
      }
    }
  } catch (err) {
    throw new Error(`Failed to scan directory: ${err.message}`);
  }
  return repos;
}
