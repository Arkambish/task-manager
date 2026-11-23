import { Injectable } from '@nestjs/common';
import type { Task } from './task.entity.js';

/**
 * In-memory storage for tasks. Data is lost when the process stops.
 *
 * This class is the only place that knows how tasks are stored. Moving to a
 * database means rewriting these four methods; the service and controller
 * stay as they are.
 */
@Injectable()
export class TasksRepository {
  // A Map keeps insertion order, so findAll() returns oldest first.
  private readonly tasks = new Map<string, Task>();

  findAll(): Task[] {
    return [...this.tasks.values()];
  }

  findById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /** Inserts the task, or replaces the stored task with the same id. */
  save(task: Task): Task {
    this.tasks.set(task.id, task);
    return task;
  }

  /** Returns false when there was no task with that id. */
  delete(id: string): boolean {
    return this.tasks.delete(id);
  }
}
