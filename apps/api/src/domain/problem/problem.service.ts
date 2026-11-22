import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabasePool } from '../../../db/pool';
import { CreateProblemDto, UpdateProblemDto } from './problem.dto';
import { Problem } from './problem.entity';

@Injectable()
export class ProblemService {
  constructor(private readonly pool: DatabasePool) {}

  async create(dto: CreateProblemDto): Promise<Problem> {
    const result = await this.pool.query<Problem>(
      'INSERT INTO problems (name, description, tests) VALUES ($1, $2, $3::jsonb) RETURNING id, name, description, tests',
      [dto.name, dto.description, JSON.stringify(dto.tests ?? [])],
    );
    return result.rows[0];
  }

  async findAll(page: number, perPage: number): Promise<Problem[]> {
    const offset = (page - 1) * perPage;
    const result = await this.pool.query<Problem>(
      'SELECT id, name, description, tests FROM problems ORDER BY id LIMIT $1 OFFSET $2',
      [perPage, offset],
    );
    return result.rows;
  }

  async findOne(id: number): Promise<Problem> {
    const result = await this.pool.query<Problem>(
      'SELECT id, name, description, tests FROM problems WHERE id = $1',
      [id],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('Problem not found');
    }
    return result.rows[0];
  }

  async update(id: number, dto: UpdateProblemDto): Promise<Problem> {
    const result = await this.pool.query<Problem>(
      `UPDATE problems
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           tests = COALESCE($4::jsonb, tests)
       WHERE id = $1
       RETURNING id, name, description, tests`,
      [
        id,
        dto.name ?? null,
        dto.description ?? null,
        dto.tests === undefined ? null : JSON.stringify(dto.tests),
      ],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('Problem not found');
    }
    return result.rows[0];
  }

  async remove(id: number): Promise<void> {
    const result = await this.pool.query('DELETE FROM problems WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new NotFoundException('Problem not found');
    }
  }
}
