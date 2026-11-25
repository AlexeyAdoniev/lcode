import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabasePool } from '../../../db/pool';
import { CreateContestDto, UpdateContestDto } from './contest.dto';
import { Contest } from './contest.entity';

const CONTEST_COLUMNS = 'id, problems, start_date AS "startDate", end_date AS "endDate"';

@Injectable()
export class ContestService {
  constructor(private readonly pool: DatabasePool) {}

  async create(dto: CreateContestDto): Promise<Contest> {
    const result = await this.pool.query<Contest>(
      `INSERT INTO contests (problems, start_date, end_date)
       VALUES ($1::jsonb, $2, $3) RETURNING ${CONTEST_COLUMNS}`,
      [JSON.stringify(dto.problems), dto.startDate, dto.endDate],
    );
    return result.rows[0];
  }

  async findAll(page: number, perPage: number): Promise<Contest[]> {
    const result = await this.pool.query<Contest>(
      `SELECT ${CONTEST_COLUMNS} FROM contests ORDER BY id LIMIT $1 OFFSET $2`,
      [perPage, (page - 1) * perPage],
    );
    return result.rows;
  }

  async findOne(id: number): Promise<Contest> {
    const result = await this.pool.query<Contest>(
      `SELECT ${CONTEST_COLUMNS} FROM contests WHERE id = $1`,
      [id],
    );
    const contest = result.rows[0];
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }
    return contest;
  }

  async update(id: number, dto: UpdateContestDto): Promise<Contest> {
    const result = await this.pool.query<Contest>(
      `UPDATE contests
       SET problems = COALESCE($2::jsonb, problems),
           start_date = COALESCE($3::timestamptz, start_date),
           end_date = COALESCE($4::timestamptz, end_date)
       WHERE id = $1
       RETURNING ${CONTEST_COLUMNS}`,
      [
        id,
        dto.problems === undefined ? null : JSON.stringify(dto.problems),
        dto.startDate ?? null,
        dto.endDate ?? null,
      ],
    );
    const contest = result.rows[0];
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }
    return contest;
  }

  async remove(id: number): Promise<void> {
    const result = await this.pool.query('DELETE FROM contests WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new NotFoundException('Contest not found');
    }
  }
}
