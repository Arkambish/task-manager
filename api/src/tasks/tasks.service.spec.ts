import { NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task.entity.js';
import { TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';

// The service has one dependency and no decorators that matter here, so the
// tests build it by hand instead of starting a Nest testing module.
describe('TasksService', () => {
  let service: TasksService;

  beforeEach(() => {
    service = new TasksService(new TasksRepository());
  });

  describe('create', () => {
    it('fills in the defaults when only a title is given', () => {
      const task = service.create({ title: 'Write docs' });

      expect(task).toMatchObject({
        title: 'Write docs',
        description: null,
        status: TaskStatus.TODO,
        dueDate: null,
      });
      expect(task.id).toEqual(expect.any(String));
      expect(Number.isNaN(Date.parse(task.createdAt))).toBe(false);
    });

    it('stores an empty description as null', () => {
      const task = service.create({ title: 'Write docs', description: '' });

      expect(task.description).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns the newest task first', () => {
      const first = service.create({ title: 'First' });
      const second = service.create({ title: 'Second' });

      expect(service.findAll().map((task) => task.id)).toEqual([
        second.id,
        first.id,
      ]);
    });
  });

  describe('update', () => {
    it('changes only the fields that were sent', () => {
      const task = service.create({
        title: 'Write docs',
        description: 'Setup guide',
        dueDate: '2026-12-04',
      });

      const updated = service.update(task.id, { status: TaskStatus.DONE });

      expect(updated).toEqual({ ...task, status: TaskStatus.DONE });
    });

    it('clears description and dueDate when they are null', () => {
      const task = service.create({
        title: 'Write docs',
        description: 'Setup guide',
        dueDate: '2026-12-04',
      });

      const updated = service.update(task.id, {
        description: null,
        dueDate: null,
      });

      expect(updated.description).toBeNull();
      expect(updated.dueDate).toBeNull();
    });

    it('throws NotFoundException for an unknown id', () => {
      expect(() => service.update('missing', { title: 'x' })).toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the task', () => {
      const task = service.create({ title: 'Write docs' });

      service.remove(task.id);

      expect(service.findAll()).toEqual([]);
    });

    it('throws NotFoundException for an unknown id', () => {
      expect(() => service.remove('missing')).toThrow(NotFoundException);
    });
  });
});
