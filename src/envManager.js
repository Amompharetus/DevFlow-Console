import fs from 'fs';
import path from 'path';

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const keys = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      keys[key] = value.trim();
    }
  });
  return keys;
}

export async function syncEnvFiles(repoPath) {
  const examplePath = path.join(repoPath, '.env.example');
  const envPath = path.join(repoPath, '.env');
  
  if (!fs.existsSync(examplePath)) {
    return { status: 'skipped', message: 'No .env.example found' };
  }
  
  if (!fs.existsSync(envPath)) {
    try {
      await fs.promises.copyFile(examplePath, envPath);
      return { status: 'created', message: 'Created .env from template' };
    } catch (err) {
      return { status: 'failed', message: `Copy failed: ${err.message}` };
    }
  }
  
  try {
    const exampleKeys = parseEnv(examplePath);
    const envKeys = parseEnv(envPath);
    
    const missingKeys = Object.keys(exampleKeys).filter(key => !(key in envKeys));
    
    if (missingKeys.length === 0) {
      return { status: 'synchronized', message: 'All environment keys in sync' };
    }
    
    // Append missing keys to .env
    let appendContent = '\n# Added by DevFlow Console\n';
    missingKeys.forEach(key => {
      appendContent += `${key}=${exampleKeys[key]}\n`;
    });
    
    await fs.promises.appendFile(envPath, appendContent);
    return { 
      status: 'updated', 
      message: `Appended missing keys (${missingKeys.join(', ')})` 
    };
  } catch (err) {
    return { status: 'failed', message: `Sync failed: ${err.message}` };
  }
}
