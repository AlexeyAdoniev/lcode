import { execFile, type ExecFileException } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

const EXECUTION_TIMEOUT_MS = 3000;
const DOCKER_CLIENT_TIMEOUT_MS = 4000;
const CLEANUP_TIMEOUT_MS = 1000;
const MAX_OUTPUT_BYTES = 64 * 1024;

type ExecuteResult = {
  error: ExecFileException | null;
  stdout: string;
  stderr: string;
};


const languageRunnerMapping = {
  py: {
    image: 'python_runner:latest',
    entrypoint: 'python',
    command: ['-I', '-B', '/runner/runner.py'],
  },
  js: {
    image: 'node_runner:latest',
    entrypoint: 'node',
    command: ['/runner/runner.cjs'],
  },
};

@Injectable()
export class SolutionExecutorService {
  async execute(language: string, code: string, args: unknown[]): Promise<ExecuteResult> {

    const runner = Object.prototype.hasOwnProperty.call(languageRunnerMapping, language)
      ? languageRunnerMapping[language as keyof typeof languageRunnerMapping]
      : undefined;

    if (!runner) throw new Error('unknown runner')

    const request = JSON.stringify({ code, args: [`[${args}]`] });
    console.log(code, 'code');
    console.log([`[${args}]`], 'args');
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
        EXECUTION_TIMEOUT_MS,
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
            '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=16m',
            '--pids-limit', '32',
            '--memory', '128m',
            '--memory-swap', '128m',
            '--cpus', '0.5',
            '--entrypoint', runner.entrypoint,
            runner.image,
            ...runner.command,
          ],
          {
            timeout: DOCKER_CLIENT_TIMEOUT_MS,
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
