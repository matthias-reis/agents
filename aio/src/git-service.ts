import { execSync } from 'child_process';

export class GitService {
  private exec(command: string): string {
    try {
      return execSync(command, { encoding: 'utf-8' }).trim();
    } catch (error) {
      throw new Error(`Git command failed: ${command}\n${error}`);
    }
  }

  getCurrentBranch(): string {
    return this.exec('git rev-parse --abbrev-ref HEAD');
  }

  branchExists(branchName: string): boolean {
    try {
      this.exec(`git show-ref --verify --quiet refs/heads/${branchName}`);
      return true;
    } catch {
      return false;
    }
  }

  createBranch(branchName: string): void {
    this.exec(`git checkout -b ${branchName}`);
  }

  switchToBranch(branchName: string): void {
    this.exec(`git checkout ${branchName}`);
  }

  ensureBranchAndSwitch(branchName: string): void {
    if (this.branchExists(branchName)) {
      this.switchToBranch(branchName);
    } else {
      this.createBranch(branchName);
    }
  }

  addFile(filePath: string): void {
    this.exec(`git add "${filePath}"`);
  }

  addAllFiles(): void {
    this.exec('git add .');
  }

  commit(message: string): void {
    // Check if there are any changes to commit
    if (!this.hasUncommittedChanges()) {
      console.log('No changes to commit, skipping commit');
      return;
    }
    this.exec(`git commit -m "${message}"`);
  }

  commitAllowEmpty(message: string): void {
    this.exec(`git commit --allow-empty -m "${message}"`);
  }

  pull(branchName?: string): void {
    if (branchName) {
      this.exec(`git pull origin ${branchName}`);
    } else {
      this.exec('git pull');
    }
  }

  push(branchName?: string): void {
    if (branchName) {
      // Try to pull first to avoid non-fast-forward issues
      try {
        this.pull(branchName);
      } catch (error) {
        // If pull fails (e.g., branch doesn't exist on remote), continue with push
        console.log('Pull failed, continuing with push (likely new branch)');
      }
      this.exec(`git push -u origin ${branchName}`);
    } else {
      this.exec('git push');
    }
  }

  getCommitHash(): string {
    return this.exec('git rev-parse HEAD');
  }

  hasUncommittedChanges(): boolean {
    try {
      const status = this.exec('git status --porcelain');
      return status.length > 0;
    } catch {
      return false;
    }
  }
}