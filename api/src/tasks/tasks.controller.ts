import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import type { Task } from './task.entity.js';
import { TasksService } from './tasks.service.js';

/**
 * HTTP layer only: reads the request, calls one service method and lets Nest
 * turn the result (or a thrown exception) into the response.
 *
 * Request bodies are validated by the global ValidationPipe (see
 * configure-app.ts) before any method here runs.
 */
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(): Task[] {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Task {
    return this.tasksService.findOne(id);
  }

  @Post() // answers 201 Created by default
  create(@Body() dto: CreateTaskDto): Task {
    return this.tasksService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto): Task {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.tasksService.remove(id);
  }
}
