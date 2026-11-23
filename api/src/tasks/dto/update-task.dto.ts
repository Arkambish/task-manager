import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TaskStatus } from '../task.entity.js';
import {
  DATE_FORMAT_MESSAGE,
  DATE_ONLY_PATTERN,
  DATE_REAL_MESSAGE,
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  isPresent,
  trim,
} from './task-rules.js';

/**
 * Body of `PATCH /tasks/:id`. Every field may be left out; a field that is
 * left out is not changed.
 *
 * This is written out instead of using `PartialType(CreateTaskDto)` because
 * `PartialType` marks every field `@IsOptional()`, which also accepts `null`.
 * Here `null` has a meaning that differs per field:
 *   - `title`, `status`: null is rejected (a task always has both).
 *   - `description`, `dueDate`: null clears the value.
 */
export class UpdateTaskDto {
  @ValidateIf(isPresent)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @ValidateIf(isPresent)
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: DATE_FORMAT_MESSAGE })
  @IsISO8601({ strict: true }, { message: DATE_REAL_MESSAGE })
  dueDate?: string | null;
}
