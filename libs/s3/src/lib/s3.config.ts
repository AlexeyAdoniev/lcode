import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

export const S3_CONFIG = Symbol('S3_CONFIG');
export const S3_CLIENT = Symbol('S3_CLIENT');

export type S3Config = {
  bucket: string;
  clientConfig: S3ClientConfig;
};

export type CreateS3ConfigOptions = {
  endpoint?: string;
};

export function createS3Config(options: CreateS3ConfigOptions = {}): S3Config {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const credentials =
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined;

  return {
    bucket: process.env.S3_BUCKET ?? 'lcode',
    clientConfig: {
      region: process.env.S3_REGION ?? 'us-east-1',
      endpoint: options.endpoint ?? process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials,
    },
  };
}

export function createS3Client(config: S3Config): S3Client {
  return new S3Client(config.clientConfig);
}
