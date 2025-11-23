import { Worker, Job, Processor } from 'bullmq'
import { getRedisClient } from '../redis/connection.js'
import { logger } from '../logger.js'

export abstract class WorkerBase<T = any, R = any> {
    protected worker: Worker
    public readonly queueName: string

    constructor(queueName: string) {
        this.queueName = queueName
        this.worker = new Worker(queueName, this.process.bind(this), {
            connection: getRedisClient(),
            concurrency: 5, // Default concurrency
        })

        this.setupListeners()
    }

    private setupListeners() {
        this.worker.on('completed', (job: Job) => {
            logger.info({ jobId: job.id, queue: this.queueName }, 'Job completed')
        })

        this.worker.on('failed', (job: Job | undefined, err: Error) => {
            logger.error({ jobId: job?.id, queue: this.queueName, err }, 'Job failed')
        })

        this.worker.on('error', (err: Error) => {
            logger.error({ queue: this.queueName, err }, 'Worker error')
        })
    }

    abstract process(job: Job<T>): Promise<R>

    public async close() {
        await this.worker.close()
    }
}
