import { execFile, type ExecFileException } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

const EXECUTION_TIMEOUT_MS = 3000;
const DOCKER_CLIENT_GRACE_MS = 1000;
const CLEANUP_TIMEOUT_MS = 1000;
const MAX_OUTPUT_BYTES = 64 * 1024;

type ExecuteResult = {
  error: ExecFileException | null;
  stdout: string;
  stderr: string;
};


type RunnerConfig = {
  image: string;
  entrypoint: string;
  command: readonly string[];
  executionTimeoutMs: number;
  memoryMb: number;
  cpus: number;
  tmpfs: readonly string[];
};

const DEFAULT_RUNNER_OPTIONS = {
  executionTimeoutMs: EXECUTION_TIMEOUT_MS,
  memoryMb: 128,
  cpus: 0.5,
  tmpfs: ['/tmp:rw,noexec,nosuid,nodev,size=16m'],
};

const LANGUAGE_RUNNERS: Readonly<Record<string, RunnerConfig | undefined>> = {
  py: {
    ...DEFAULT_RUNNER_OPTIONS,
    image: 'python_runner:latest',
    entrypoint: 'python',
    command: ['-I', '-B', '/runner/runner.py'],
  },
  js: {
    ...DEFAULT_RUNNER_OPTIONS,
    image: 'node_runner:latest',
    entrypoint: 'node',
    command: ['/runner/runner.cjs'],
  },
  go: {
    ...DEFAULT_RUNNER_OPTIONS,
    image: 'go_runner:latest',
    entrypoint: '/runner/runner',
    command: [],
    executionTimeoutMs: 60000,
    memoryMb: 768,
    cpus: 1,
    tmpfs: [
      ...DEFAULT_RUNNER_OPTIONS.tmpfs,
      '/work:rw,exec,nosuid,nodev,size=512m,mode=1777',
    ],
  },
};

@Injectable()
export class SolutionExecutorService {
  async execute(language: string, code: string, args: unknown[]): Promise<ExecuteResult> {

    const runner = Object.prototype.hasOwnProperty.call(LANGUAGE_RUNNERS, language)
      ? LANGUAGE_RUNNERS[language]
      : undefined;

    if (!runner) {
      throw new Error(`Unknown runner: ${language}`);
    }

    const request = JSON.stringify({ code, args: [`[${args}]`] });

    return new Promise((resolve, reject) => {
      const runName = `${randomUUID()}-container`;

      const cleanupContainer = (onComplete = () => { }) => {
        execFile(
          'docker',
          ['rm', '-f', runName],
          {
            timeout: CLEANUP_TIMEOUT_MS,
            maxBuffer: MAX_OUTPUT_BYTES,
          },
          () => onComplete(),
        );
      };

      const cleanupTimer = setTimeout(
        cleanupContainer,
        runner.executionTimeoutMs,
      );

      try {
        const child = execFile(
          'docker',
          [
            'run',
            '--rm',
            '-i',
            '--name', runName,
            '--network', 'none',
            '--user', '65534:65534',
            '--cap-drop', 'ALL',
            '--security-opt', 'no-new-privileges=true',
            '--read-only',
            ...runner.tmpfs.flatMap((mount) => ['--tmpfs', mount]),
            '--pids-limit', '32',
            '--memory', `${runner.memoryMb}m`,
            '--memory-swap', `${runner.memoryMb}m`,
            '--cpus', String(runner.cpus),
            '--entrypoint', runner.entrypoint,
            runner.image,
            ...runner.command,
          ],
          {
            timeout: runner.executionTimeoutMs + DOCKER_CLIENT_GRACE_MS,
            maxBuffer: MAX_OUTPUT_BYTES,
          },
          (error, stdout, stderr) => {
            clearTimeout(cleanupTimer);
            cleanupContainer(() => {
              resolve({ error, stdout, stderr });
            });
          },
        );

        // Docker can exit before consuming stdin, for example if the image is missing.
        child.stdin?.on('error', () => { });
        child.stdin?.end(request);
      } catch (error: unknown) {
        console.log(error, 'error');
        clearTimeout(cleanupTimer);
        cleanupContainer(() => reject(error));
      }
    });
  }
}
