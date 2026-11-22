import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_CLIENT, S3_CONFIG, S3Config } from '@lcode/s3';
import { DatabasePool } from '../../../db/pool';
import { CreateSolutionDto, UpdateSolutionDto } from './solution.dto';
import { CreateSolutionResponse, Solution } from './solution.entity';
import { SolutionEventsPublisher } from './solution-events.publisher';

const S3_PRESIGNED_URL_EXPIRES_IN_SECONDS = 15 * 60;

@Injectable()
export class SolutionService {
  constructor(
    private readonly pool: DatabasePool,
    @Inject(S3_CONFIG) private readonly s3Config: S3Config,
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly solutionEvents: SolutionEventsPublisher,
  ) {}

  async create(dto: CreateSolutionDto): Promise<CreateSolutionResponse> {
    const result = await this.pool.query<Solution>(
      `INSERT INTO solutions (problem_id, user_id, language, codeS3Url)
       VALUES ($1, $2, $3, $4)
       RETURNING id,
                 problem_id AS "problemId",
                 user_id AS "userId",
                 language,
                 codeS3Url AS "codeS3Url"`,
      [
        dto.problemId,
        dto.userId,
        dto.language,
        dto.codeS3Url,
      ],
    );
    const solution = result.rows[0];
    const key = `solutions/${solution.id}/source`;
    const codeS3Url = `s3://${this.s3Config.bucket}/${key}`;

    await this.pool.query(
      'UPDATE solutions SET codeS3Url = $2 WHERE id = $1',
      [solution.id, codeS3Url],
    );

    const s3PresignedUrl = await getSignedUrl(
      this.s3Client,
      new PutObjectCommand({
        Bucket: this.s3Config.bucket,
        Key: key,
      }),
      { expiresIn: S3_PRESIGNED_URL_EXPIRES_IN_SECONDS },
    );

    await this.solutionEvents.publishCreated(solution.id);

    return {
      solution: {
        ...solution,
        codeS3Url,
      },
      s3PresignedUrl,
    };
  }

  async findAll(page: number, perPage: number): Promise<Solution[]> {
    const offset = (page - 1) * perPage;
    const result = await this.pool.query<Solution>(
      `SELECT id,
              problem_id AS "problemId",
              user_id AS "userId",
              passed,
              exec_ms AS "execMs",
              language,
              codeS3Url AS "codeS3Url"
       FROM solutions
       ORDER BY id
       LIMIT $1 OFFSET $2`,
      [perPage, offset],
    );
    return result.rows;
  }

  async findOne(id: number): Promise<Solution> {
    const result = await this.pool.query<Solution>(
      `SELECT id,
              problem_id AS "problemId",
              user_id AS "userId",
              passed,
              exec_ms AS "execMs",
              language,
              codeS3Url AS "codeS3Url"
       FROM solutions
       WHERE id = $1`,
      [id],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('Solution not found');
    }
    return result.rows[0];
  }

  async update(id: number, dto: UpdateSolutionDto): Promise<Solution> {
    const result = await this.pool.query<Solution>(
      `UPDATE solutions
       SET problem_id = COALESCE($2, problem_id),
           user_id = COALESCE($3, user_id),
           passed = COALESCE($4, passed),
           exec_ms = COALESCE($5, exec_ms),
           language = COALESCE($6, language),
           codeS3Url = COALESCE($7, codeS3Url)
       WHERE id = $1
       RETURNING id,
                 problem_id AS "problemId",
                 user_id AS "userId",
                 passed,
                 exec_ms AS "execMs",
                 language,
                 codeS3Url AS "codeS3Url"`,
      [
        id,
        dto.problemId ?? null,
        dto.userId ?? null,
        dto.passed ?? null,
        dto.execMs ?? null,
        dto.language ?? null,
        dto.codeS3Url ?? null,
      ],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('Solution not found');
    }
    return result.rows[0];
  }

  async remove(id: number): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM solutions WHERE id = $1',
      [id],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException('Solution not found');
    }
  }
}
