import { Worker } from 'worker_threads';
import os from 'os';

interface WorkerTask {
  id: string;
  data: unknown;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

class WorkerPool {
  private workers: Worker[];
  private taskQueue: WorkerTask[];
  private activeTasks: Map<number, WorkerTask>;
  private workerFile: string;
  private maxWorkers: number;

  constructor(
    workerFile: string,
    maxWorkers: number = Math.max(1, Math.floor(os.cpus().length / 2))
  ) {
    this.workerFile = workerFile;
    this.maxWorkers = maxWorkers;
    this.workers = [];
    this.taskQueue = [];
    this.activeTasks = new Map();

    // 初始化工作池
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(this.workerFile);
      this.workers.push(worker);

      worker.on('message', result => this.handleWorkerMessage(worker, result));
      worker.on('error', error => this.handleWorkerError(worker, error));
      worker.on('exit', code => this.handleWorkerExit(worker, code));
    }
  }

  private handleWorkerMessage(worker: Worker, result: unknown): void {
    const task = this.activeTasks.get(worker.threadId);
    if (task) {
      this.activeTasks.delete(worker.threadId);
      task.resolve(result);
      this.processNextTask(worker);
    }
  }

  private handleWorkerError(worker: Worker, error: Error): void {
    const task = this.activeTasks.get(worker.threadId);
    if (task) {
      this.activeTasks.delete(worker.threadId);
      task.reject(error);
    }
    this.replaceWorker(worker);
  }

  private handleWorkerExit(worker: Worker, code: number): void {
    const task = this.activeTasks.get(worker.threadId);
    if (task) {
      this.activeTasks.delete(worker.threadId);
      task.reject(new Error(`Worker exited with code ${code}`));
    }
    this.replaceWorker(worker);
  }

  private replaceWorker(worker: Worker): void {
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    const newWorker = new Worker(this.workerFile);
    this.workers.push(newWorker);

    newWorker.on('message', result => this.handleWorkerMessage(newWorker, result));
    newWorker.on('error', error => this.handleWorkerError(newWorker, error));
    newWorker.on('exit', code => this.handleWorkerExit(newWorker, code));

    // 处理下一个任务
    if (this.taskQueue.length > 0) {
      this.processNextTask(newWorker);
    }
  }

  private processNextTask(worker: Worker): void {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;
      this.activeTasks.set(worker.threadId, task);
      worker.postMessage(task.data);
    }
  }

  /**
   * 添加任务到工作池
   */
  async postTask(data: unknown): Promise<unknown> {
    const taskId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    return new Promise((resolve, reject) => {
      const task: WorkerTask = { id: taskId, data, resolve, reject };

      // 找到空闲的 worker
      const idleWorker = this.workers.find(worker => !this.activeTasks.has(worker.threadId));

      if (idleWorker) {
        this.activeTasks.set(idleWorker.threadId, task);
        idleWorker.postMessage(data);
      } else {
        // 所有 worker 都忙，添加到队列
        this.taskQueue.push(task);
      }
    });
  }

  /**
   * 获取工作池状态
   */
  getStatus(): {
    totalWorkers: number;
    activeWorkers: number;
    pendingTasks: number;
  } {
    return {
      totalWorkers: this.maxWorkers,
      activeWorkers: this.activeTasks.size,
      pendingTasks: this.taskQueue.length,
    };
  }

  /**
   * 终止所有 worker
   */
  terminate(): Promise<void[]> {
    return Promise.all(
      this.workers.map(
        worker =>
          new Promise<void>(resolve =>
            worker
              .terminate()
              .then(() => resolve())
              .catch(() => resolve())
          )
      )
    );
  }
}

export { WorkerPool };
