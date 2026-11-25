import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_CLIENT, S3_CONFIG, S3Config } from '@lcode/s3';
import { DatabasePool } from '../../../db/pool';
import { CreateSolutionDto, UpdateSolutionDto } from './dto/solution.dto';
import {
  CreateSolutionResponse,
  Solution,
  SOLUTION_STATUS,
} from './entities/solution.entity';
import { SolutionEventsPublisher } from './events/solution-events.publisher';
import { S3_PRESIGN_CLIENT } from './interfaces/solution.tokens';

const S3_PRESIGNED_URL_EXPIRES_IN_SECONDS = 15 * 60;

@Injectable()
export class SolutionService {
  constructor(
    private readonly pool: DatabasePool,
    @Inject(S3_CONFIG) private readonly s3Config: S3Config,
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    @Inject(S3_PRESIGN_CLIENT) private readonly s3PresignClient: S3Client,
    private readonly solutionEvents: SolutionEventsPublisher,
  ) { }

  async create(dto: CreateSolutionDto): Promise<CreateSolutionResponse> {
    const result = await this.pool.query<Solution>(
      `INSERT INTO solutions (problem_id, user_id, language, codeS3Url, status, contest_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id,
                 problem_id AS "problemId",
                 user_id AS "userId",
                 language,
                 codeS3Url AS "codeS3Url",
                 status,
                 contest_id AS "contestId"
                 `,

      [
        dto.problemId,
        dto.userId,
        dto.language,
        dto.codeS3Url,
        SOLUTION_STATUS.PENDING_UPLOAD,
        dto.contestId
      ],
    );
    const solution = result.rows[0];
    const key = `solutions/${solution.id}/source`;
    const codeS3Url = `s3://${this.s3Config.bucket}/${key}`;

    //const contest = await this.pool.query<Contest>(``, [])

    await this.pool.query('UPDATE solutions SET codeS3Url = $2 WHERE id = $1', [
      solution.id,
      codeS3Url,
    ]);

    const s3PresignedUrl = await getSignedUrl(
      this.s3PresignClient,
      new PutObjectCommand({
        Bucket: this.s3Config.bucket,
        Key: key,
      }),
      { expiresIn: S3_PRESIGNED_URL_EXPIRES_IN_SECONDS },
    );

    return {
      solution: {
        ...solution,
        codeS3Url,
      },
      s3PresignedUrl,
    };
  }

  async completeUpload(id: number): Promise<Solution> {
    const solution = await this.findOne(id);
    if (solution.status === SOLUTION_STATUS.READY) {
      return solution;
    }

    await this.assertSourceExists(id);
    await this.solutionEvents.publishReady(solution);

    const result = await this.pool.query<Solution>(
      `UPDATE solutions
       SET status = $2
       WHERE id = $1 AND status = $3
       RETURNING id,
                 problem_id AS "problemId",
                 user_id AS "userId",
                 passed,
                 exec_ms AS "execMs",
                 language,
                 codeS3Url AS "codeS3Url",
                 status`,
      [id, SOLUTION_STATUS.READY, SOLUTION_STATUS.PENDING_UPLOAD],
    );
    return result.rows[0] ?? this.findOne(id);
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
              codeS3Url AS "codeS3Url",
              status
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
              codeS3Url AS "codeS3Url",
              status
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
    console.log(dto, 'dto');
    const result = await this.pool.query<Solution>(
      `UPDATE solutions
       SET problem_id = COALESCE($2, problem_id),
           user_id = COALESCE($3, user_id),
           passed = COALESCE($4, passed),
           exec_ms = COALESCE($5, exec_ms),
           language = COALESCE($6, language),
           codeS3Url = COALESCE($7, codeS3Url),
           status = COALESCE($8, status)
       WHERE id = $1
       RETURNING id,
                 problem_id AS "problemId",
                 user_id AS "userId",
                 passed,
                 exec_ms AS "execMs",
                 language,
                 codeS3Url AS "codeS3Url",
                 status`,
      [
        id,
        dto.problemId ?? null,
        dto.userId ?? null,
        dto.passed ?? null,
        dto.execMs ?? null,
        dto.language ?? null,
        dto.codeS3Url ?? null,
        dto.status ?? null
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

  private async assertSourceExists(solutionId: number): Promise<void> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.s3Config.bucket,
          Key: `solutions/${solutionId}/source`,
        }),
      );
    } catch (error: unknown) {
      if (this.isNotFound(error)) {
        throw new ConflictException(
          'Solution source file has not been uploaded',
        );
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

  async getLeaderboard(contestId: number) {
    const result = await this.pool.query(`
      WITH best_solutions AS (
    SELECT DISTINCT ON (user_id, problem_id)
        user_id,
        problem_id,
        contest_id
    FROM solutions
    WHERE contest_id = $1
      AND passed = TRUE
    ORDER BY user_id, problem_id
)
SELECT
    s.user_id AS "userId",
    u.name AS "username",
    SUM((p->>'score')::numeric) AS "totalScore"
FROM best_solutions s
JOIN users u ON u.id = s.user_id
JOIN contests c ON c.id = s.contest_id
CROSS JOIN LATERAL jsonb_array_elements(c.problems) p
WHERE (p->>'id')::int = s.problem_id
GROUP BY s.user_id, u.name
ORDER BY "totalScore" DESC, s.user_id ASC;
`, [contestId]);

    return result.rows;
  }
}
