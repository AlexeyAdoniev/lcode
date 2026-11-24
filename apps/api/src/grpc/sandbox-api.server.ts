import { Injectable, NotFoundException, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { loadPackageDefinition, Server, ServerCredentials, ServiceDefinition, ServerUnaryCall, sendUnaryData, status } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';
import { ProblemService } from '../domain/problem/problem.service';
import { SolutionService } from '../domain/solution/solution.service';

interface UpdateSolutionRequest {
  solutionId: number;
  passed: boolean;
  execMs: number;
  status: string;
}

@Injectable()
export class SandboxApiServer implements OnModuleInit, OnApplicationShutdown {
  private readonly server = new Server();

  constructor(
    private readonly problemService: ProblemService,
    private readonly solutionService: SolutionService,
  ) { }

  async onModuleInit(): Promise<void> {
    const definition = loadSync(join(__dirname, 'assets/proto/sandbox-api.proto'));
    const descriptor = loadPackageDefinition(definition) as unknown as {
      lcode: { SandboxApi: { service: ServiceDefinition } };
    };

    // Register transport handlers separately from the database operations.
    this.server.addService(descriptor.lcode.SandboxApi.service, {
      getProblemTests: (
        call: ServerUnaryCall<{ problemId: number }, { testsJson: string }>,
        callback: sendUnaryData<{ testsJson: string }>,
      ) => { void this.getProblemTests(call.request.problemId, callback); },
      updateSolution: (
        call: ServerUnaryCall<UpdateSolutionRequest, Record<string, never>>,
        callback: sendUnaryData<Record<string, never>>,
      ) => { void this.updateSolution(call.request, callback); },
    });
    const address = process.env.API_GRPC_BIND_ADDRESS ?? '0.0.0.0:50051';
    await new Promise<number>((resolve, reject) => {
      this.server.bindAsync(address, ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  }

  private async getProblemTests(
    problemId: number,
    callback: sendUnaryData<{ testsJson: string }>,
  ): Promise<void> {
    if (!Number.isInteger(problemId) || problemId <= 0) {
      callback({ code: status.INVALID_ARGUMENT, message: 'problemId must be a positive integer' });
      return;
    }

    try {
      const problem = await this.problemService.findOne(problemId);
      callback(null, { testsJson: JSON.stringify(problem.tests) });
    } catch (error: unknown) {
      callback({
        code: error instanceof NotFoundException ? status.NOT_FOUND : status.INTERNAL,
        message: error instanceof NotFoundException ? 'Problem not found' : 'Failed to fetch problem tests',
      });
    }
  }

  private async updateSolution(
    request: UpdateSolutionRequest,
    callback: sendUnaryData<Record<string, never>>,
  ): Promise<void> {
    // Proto3 omits scalar defaults on the wire, including false and zero.
    const { solutionId, passed = false, execMs = 0, status: solutionStatus } = request;
    if (
      !Number.isInteger(solutionId) || solutionId <= 0 ||
      typeof passed !== 'boolean' || !Number.isFinite(execMs) || execMs < 0 ||
      typeof solutionStatus !== 'string' || solutionStatus.trim().length === 0
    ) {
      callback({ code: status.INVALID_ARGUMENT, message: 'Invalid solution result' });
      return;
    }

    try {
      console.log(solutionId, 'here');
      await this.solutionService.update(solutionId, {
        passed,
        execMs,
        status: solutionStatus,
      });
      callback(null, {});
    } catch (error: unknown) {
      callback({
        code: error instanceof NotFoundException ? status.NOT_FOUND : status.INTERNAL,
        message: error instanceof NotFoundException ? 'Solution not found' : 'Failed to update solution',
      });
    }
  }

  onApplicationShutdown(): Promise<void> {
    return new Promise((resolve) => {
      const timeoutMs = 5000;
      const timeout = setTimeout(() => {
        this.server.forceShutdown();
        resolve();
      }, timeoutMs);
      this.server.tryShutdown(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}
