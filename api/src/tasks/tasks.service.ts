import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TaskStatus, type Task } from './task.entity.js';
import { TasksRepository } from './tasks.repository.js';

// The same text for every "no such task" case. It is shown to people in the
// web app, so it does not repeat the id they never saw.
const TASK_NOT_FOUND = 'Task not found. It may have been deleted.';

/** The rules for tasks. Knows nothing about HTTP except Nest's exceptions. */
@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  /** All tasks, newest first. */
  findAll(): Task[] {
    return this.tasksRepository.findAll().reverse();
  }

  findOne(id: string): Task {
    const task = this.tasksRepository.findById(id);
    if (!task) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }
    return task;
  }

  create(dto: CreateTaskDto): Task {
    return this.tasksRepository.save({
      id: randomUUID(),
      title: dto.title,
      // `||` on purpose: undefined, null and '' all mean "no description".
      description: dto.description || null,
      status: dto.status ?? TaskStatus.TODO,
      dueDate: dto.dueDate ?? null,
      createdAt: new Date().toISOString(),
    });
  }

  update(id: string, dto: UpdateTaskDto): Task {
    // Copy, so the stored task only changes when save() is called.
    const task = { ...this.findOne(id) };

    // undefined means "not sent": leave the field alone.
    // null (description and dueDate only) means "clear it".
    if (dto.title !== undefined) {
      task.title = dto.title;
    }
    if (dto.description !== undefined) {
      task.description = dto.description || null;
    }
    if (dto.status !== undefined) {
      task.status = dto.status;
    }
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate;
    }

    return this.tasksRepository.save(task);
  }

  remove(id: string): void {
    if (!this.tasksRepository.delete(id)) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }
  }
}
