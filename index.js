#!/usr/bin/env node

import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import simpleGit from 'simple-git';

import { scanWorkspace } from './src/scanner.js';
import { purgeCache } from './src/cleaner.js';
import { syncEnvFiles } from './src/envManager.js';

// Setup default directory to look for repositories
const defaultBaseDir = path.dirname(process.cwd()); 

async function mainLoop() {
  console.clear();
  console.log(chalk.bold.yellow('\n======================================'));
  console.log(chalk.bold.green('       DEVFLOW AUTOMATION CONSOLE      '));
  console.log(chalk.yellow('======================================\n'));

  // Ask for workspace folder to scan
  const dirResponse = await prompts({
    type: 'text',
    name: 'workspace',
    message: 'Enter workspace base path to scan:',
    initial: defaultBaseDir
  });

  const baseDir = dirResponse.workspace;
  if (!baseDir || !fs.existsSync(baseDir)) {
    console.log(chalk.red('\nInvalid directory path. Exiting...\n'));
    return;
  }

  let running = true;
  while (running) {
    const choice = await prompts({
      type: 'select',
      name: 'action',
      message: 'Select action to execute:',
      choices: [
        { title: '🔍 Scan Workspace Repositories', value: 'scan' },
        { title: '🧹 Purge Project Caches (node_modules, dist, etc.)', value: 'clean' },
        { title: '🔄 Sync Environment Templates (.env)', value: 'sync' },
        { title: '🚀 Batch Git Pull Upstream Updates', value: 'pull' },
        { title: '🚪 Exit Console', value: 'exit' }
      ]
    });

    if (!choice.action || choice.action === 'exit') {
      console.log(chalk.green('\nGoodbye!\n'));
      running = false;
      break;
    }

    switch (choice.action) {
      case 'scan':
        await handleScan(baseDir);
        break;
      case 'clean':
        await handleClean(baseDir);
        break;
      case 'sync':
        await handleSync(baseDir);
        break;
      case 'pull':
        await handlePull(baseDir);
        break;
    }
    
    console.log(chalk.gray('\n--------------------------------------'));
    await prompts({
      type: 'text',
      name: 'continue',
      message: 'Press ENTER to return to menu...'
    });
    console.clear();
    console.log(chalk.bold.yellow('\n======================================'));
    console.log(chalk.bold.green('       DEVFLOW AUTOMATION CONSOLE      '));
    console.log(chalk.yellow('======================================\n'));
  }
}

async function handleScan(baseDir) {
  const spinner = ora('Scanning repositories...').start();
  try {
    const repos = await scanWorkspace(baseDir);
    spinner.succeed(`Scanned directory successfully. Found ${repos.length} repository/repositories.`);
    
    if (repos.length === 0) {
      console.log(chalk.yellow('\nNo Git repositories found in this directory.'));
      return;
    }

    console.log('\n' + chalk.bold.white('Repository Status Summary:'));
    repos.forEach(repo => {
      const statusText = repo.isClean ? chalk.green('Clean') : chalk.yellow('Uncommitted changes');
      const aheadBehind = `[Ahead: ${repo.ahead || 0} | Behind: ${repo.behind || 0}]`;
      console.log(
        `• ${chalk.bold.cyan(repo.name)} (${chalk.magenta(repo.branch)}) - ${statusText} - ${chalk.gray(aheadBehind)}`
      );
      if (!repo.isClean) {
        console.log(
          `  ${chalk.gray(`Modified: ${repo.modified} | Added: ${repo.created} | Deleted: ${repo.deleted}`)}`
        );
      }
    });
  } catch (err) {
    spinner.fail(`Scanning failed: ${err.message}`);
  }
}

async function handleClean(baseDir) {
  const repos = await scanWorkspace(baseDir);
  if (repos.length === 0) {
    console.log(chalk.yellow('\nNo repositories found to clean.'));
    return;
  }

  const repoChoice = await prompts({
    type: 'multiselect',
    name: 'selected',
    message: 'Select repositories to clean (Space to select, Enter to confirm):',
    choices: repos.map(r => ({ title: r.name, value: r })),
    min: 1
  });

  if (!repoChoice.selected || repoChoice.selected.length === 0) return;

  const targetChoice = await prompts({
    type: 'multiselect',
    name: 'targets',
    message: 'Select targets to delete:',
    choices: [
      { title: 'node_modules (Package cache)', value: 'node_modules', selected: true },
      { title: 'dist & build (Compilation output)', value: 'dist', selected: true },
      { title: '.next (NextJS compilation cache)', value: '.next' },
      { title: 'package-lock.json (Lock file)', value: 'package-lock.json' },
      { title: 'yarn.lock / pnpm-lock.yaml', value: 'yarn.lock' }
    ],
    min: 1
  });

  if (!targetChoice.targets || targetChoice.targets.length === 0) return;

  for (const repo of repoChoice.selected) {
    const spinner = ora(`Cleaning ${repo.name}...`).start();
    const results = await purgeCache(repo.path, targetChoice.targets);
    const successCount = results.filter(r => r.status === 'success').length;
    spinner.succeed(`Cleaned ${repo.name}. Successfully purged ${successCount} target(s).`);
  }
}

async function handleSync(baseDir) {
  const repos = await scanWorkspace(baseDir);
  if (repos.length === 0) {
    console.log(chalk.yellow('\nNo repositories found.'));
    return;
  }

  const spinner = ora('Checking environment variables...').start();
  let updatedCount = 0;
  
  for (const repo of repos) {
    const res = await syncEnvFiles(repo.path);
    if (res.status === 'created' || res.status === 'updated') {
      updatedCount++;
      console.log(`\n  [${chalk.cyan(repo.name)}] ${chalk.green(res.message)}`);
    }
  }
  
  if (updatedCount === 0) {
    spinner.succeed('All environment files are fully synchronized.');
  } else {
    spinner.succeed(`Completed environment checking. Updated ${updatedCount} repo(s).`);
  }
}

async function handlePull(baseDir) {
  const repos = await scanWorkspace(baseDir);
  if (repos.length === 0) {
    console.log(chalk.yellow('\nNo repositories found to pull.'));
    return;
  }

  console.log(chalk.gray('\nStarting batch git pull...'));
  
  for (const repo of repos) {
    const spinner = ora(`Pulling updates for ${repo.name}...`).start();
    try {
      const git = simpleGit(repo.path);
      const res = await git.pull();
      if (res.summary.changes > 0 || res.summary.insertions > 0 || res.summary.deletions > 0) {
        spinner.succeed(`Pulled updates for ${repo.name}: ${res.summary.changes} file(s) updated.`);
      } else {
        spinner.succeed(`Already up to date: ${repo.name}`);
      }
    } catch (err) {
      spinner.fail(`Failed to pull ${repo.name}: ${err.message}`);
    }
  }
}

mainLoop();
