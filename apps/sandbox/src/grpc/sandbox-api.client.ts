import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Client, credentials, loadPackageDefinition, ServiceError } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';

type RpcCallback<T> = (error: ServiceError | null, response: T) => void;

export interface UpdateSolutionRequest {
  solutionId: number;
  passed: boolean;
  execMs: number;
  status: string;
}

interface SandboxApiTransport extends Client {
  getProblemTests(request: { problemId: number }, options: { deadline: Date }, callback: RpcCallback<{ testsJson: string }>): void;
  updateSolution(request: UpdateSolutionRequest, options: { deadline: Date }, callback: RpcCallback<Record<string, never>>): void;
}

@Injectable()
export class SandboxApiClient implements OnModuleDestroy {
  private readonly client: SandboxApiTransport;
  private readonly timeoutMs = 5000;

  constructor() {
    const definition = loadSync(join(__dirname, 'assets/proto/sandbox-api.proto'));
    const descriptor = loadPackageDefinition(definition) as unknown as {
      lcode: { SandboxApi: new (address: string, channelCredentials: ReturnType<typeof credentials.createInsecure>) => SandboxApiTransport };
    };
    this.client = new descriptor.lcode.SandboxApi(
      process.env.API_GRPC_ADDRESS ?? 'localhost:50051',
      credentials.createInsecure(),
    );
  }

  getProblemTests(problemId: number): Promise<{ testsJson: string }> {
    return new Promise((resolve, reject) => {
      this.client.getProblemTests({ problemId }, { deadline: new Date(Date.now() + this.timeoutMs) }, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }

  updateSolution(request: UpdateSolutionRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.updateSolution(request, { deadline: new Date(Date.now() + this.timeoutMs) }, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  onModuleDestroy(): void {
    this.client.close();
  }
}
