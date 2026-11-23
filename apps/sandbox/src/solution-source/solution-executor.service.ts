import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';



const EXECUTION_TIMEOUT_MS = 3000;
const DOCKER_CLIENT_TIMEOUT_MS = 4000;
const CLEANUP_TIMEOUT_MS = 1000;
const MAX_OUTPUT_BYTES = 64 * 1024;

@Injectable()
export class SolutionExecutorService {


    async execute(code: string, args: string[] = ['5', '43']): Promise<unknown> {

        return new Promise((resolve, reject) => {
            try {
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

                execFile(
                    'docker',
                    [
                        'run',
                        '--rm',
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
                        'python_runner:latest',
                        'python', '-I', '-B', '-c', code, ...args
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
            } catch (e: any) {
                reject(e.message)
            }

        });
    }

}