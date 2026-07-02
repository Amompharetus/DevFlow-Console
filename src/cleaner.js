import fs from 'fs';
import path from 'path';

export async function purgeCache(repoPath, targets) {
  const results = [];
  
  for (const target of targets) {
    const targetPath = path.join(repoPath, target);
    if (fs.existsSync(targetPath)) {
      try {
        const stat = await fs.promises.stat(targetPath);
        if (stat.isDirectory()) {
          await fs.promises.rm(targetPath, { recursive: true, force: true });
        } else {
          await fs.promises.unlink(targetPath);
        }
        results.push({ name: target, status: 'success' });
      } catch (err) {
        results.push({ name: target, status: 'failed', error: err.message });
      }
    } else {
      results.push({ name: target, status: 'skipped' });
    }
  }
  
  return results;
}
