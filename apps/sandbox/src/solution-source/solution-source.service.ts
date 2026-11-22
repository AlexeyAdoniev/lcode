import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import type { S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { S3_CLIENT, S3_CONFIG, S3Config } from '@lcode/s3';

const FILE_POLL_INTERVAL_MS = 1_000;
const FETCH_TIMEOUT_MS = 20_000;


@Injectable()
export class SolutionSourceService {
  constructor(
    @Inject(S3_CONFIG) private readonly s3Config: S3Config,
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
  ) { }

  async waitAndFetch(solutionId: number): Promise<Buffer> {
    const key = `solutions/${solutionId}/source`;

    await Promise.race([
      this.waitForFileWithPolling(key),
      this.wait(FETCH_TIMEOUT_MS).then(() => {
        throw new Error(`Timeout waiting for solution ${solutionId} source file after ${FETCH_TIMEOUT_MS}ms`);
      }),
    ]);

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.s3Config.bucket,
        Key: key,
      }),
    );
    if (!response.Body) {
      throw new Error(`Solution ${solutionId} source file has no body`);
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  private async waitForFileWithPolling(key: string): Promise<void> {
    while (!(await this.doesObjectExist(key))) {
      await this.wait(FILE_POLL_INTERVAL_MS);
    }
  }

  private async doesObjectExist(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.s3Config.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error: unknown) {
      if (this.isNotFound(error)) {
        return false;
      }

      throw error;
    }
  }

  private isNotFound(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const s3Error = error as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
    };
    return (
      s3Error.name === 'NotFound' ||
      s3Error.name === 'NoSuchKey' ||
      s3Error.$metadata?.httpStatusCode === 404
    );
  }

  private wait(timeoutMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeoutMs));
  }
}
