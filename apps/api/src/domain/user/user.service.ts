import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabasePool } from '../../../db/pool';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(private readonly pool: DatabasePool) {}

  async create(dto: CreateUserDto): Promise<User> {
    try {
      const result = await this.pool.query<User>(
        'INSERT INTO users (name) VALUES ($1) RETURNING id, name',
        [dto.name],
      );
      return result.rows[0];
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('User name already exists');
      }
      throw error;
    }
  }

  async findAll(page: number, perPage: number): Promise<User[]> {
    const offset = (page - 1) * perPage;
    const result = await this.pool.query<User>(
      'SELECT id, name FROM users ORDER BY id LIMIT $1 OFFSET $2',
      [perPage, offset],
    );
    return result.rows;
  }

  async findOne(id: number): Promise<User> {
    const result = await this.pool.query<User>(
      'SELECT id, name FROM users WHERE id = $1',
      [id],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('User not found');
    }
    return result.rows[0];
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    try {
      const result = await this.pool.query<User>(
        `UPDATE users
         SET name = COALESCE($2, name)
         WHERE id = $1
         RETURNING id, name`,
        [id, dto.name ?? null],
      );
      if (!result.rows[0]) {
        throw new NotFoundException('User not found');
      }
      return result.rows[0];
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('User name already exists');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.pool.query('DELETE FROM users WHERE id = $1', [
      id,
    ]);
    if (result.rowCount === 0) {
      throw new NotFoundException('User not found');
    }
  }

  private isUniqueViolation(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
