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

/** Body of `POST /tasks`. Only `title` is required. */
export class CreateTaskDto {
  // Trim first, so a title made only of spaces fails @IsNotEmpty.
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title: string;

  // @IsOptional skips the rules below for undefined AND null: both mean
  // "no description".
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  // May be left out (the service defaults it to TODO) but may not be null.
  @ValidateIf(isPresent)
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  // Two rules on purpose: the pattern rejects timestamps, and strict ISO 8601
  // rejects dates that do not exist, such as 2026-02-30.
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: DATE_FORMAT_MESSAGE })
  @IsISO8601({ strict: true }, { message: DATE_REAL_MESSAGE })
  dueDate?: string | null;
}
