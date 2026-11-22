import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabasePool } from '../../../db/pool';
import { CreateSolutionDto, UpdateSolutionDto } from './solution.dto';
import { Solution } from './solution.entity';

@Injectable()
export class SolutionService {
  constructor(private readonly pool: DatabasePool) { }

  async create(dto: CreateSolutionDto): Promise<Solution> {
    const result = await this.pool.query<Solution>(
      `INSERT INTO solutions (problem_id, user_id, passed, exec_ms, language, code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id,
                 problem_id AS "problemId",
                 user_id AS "userId",
                 passed,
                 exec_ms AS "execMs",
                 language,
                 code`,
      [
        dto.problemId,
        dto.userId,
        dto.passed,
        dto.execMs,
        dto.language,
        dto.codeS3Url,
      ],
    );
    return result.rows[0];
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
              code
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
              code
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
           code = COALESCE($7, code)
       WHERE id = $1
       RETURNING id,
                 problem_id AS "problemId",
                 user_id AS "userId",
                 passed,
                 exec_ms AS "execMs",
                 language,
                 code`,
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
