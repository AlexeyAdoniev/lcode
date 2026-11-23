import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { S3_CLIENT, S3_CONFIG, S3Config } from '@lcode/s3';

@Injectable()
export class SolutionSourceService {
  constructor(
    @Inject(S3_CONFIG) private readonly s3Config: S3Config,
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
  ) {}

  async fetch(solutionId: number): Promise<Buffer> {
    const key = `solutions/${solutionId}/source`;

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
}
