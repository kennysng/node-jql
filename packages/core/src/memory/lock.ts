import { app, logger } from '../app'

/**
 * Infinite READING at the same time
 * but one and only one WRITING
 */
export class TableLock {
  public readonly requestingRead: string[] = []
  public readonly reading: string[] = []
  public readonly requestingWrite: string[] = []
  public readonly writing: string[] = []
  public isClosed: boolean = false

  constructor(public readonly name: string) {
  }

  /**
   * Check whether read is available
   */
  get readEnabled(): boolean {
    return !this.requestingWrite.length && !this.writing.length
  }

  /**
   * Check whether write is available
   */
  get writeEnabled(): boolean {
    return !this.reading.length && !this.writing.length
  }

  /**
   * Request for reading
   * @param sessionId [string]
   */
  public async read(sessionId: string): Promise<TableLock> {
    // closed, no new request
    if (this.isClosed) {
      throw new Error(`Table '${this.name}' does not exist`)
    }

    // wait reading
    this.requestingRead.push(sessionId)
    const self = this
    await new Promise(resolve => {
      (function waitAndCheck(firstCall = false) {
        setTimeout(() => {
          if (self.readEnabled && self.requestingRead[0] === sessionId) {
            self.requestingRead.shift()
            self.reading.push(sessionId)
            return resolve()
          }
          waitAndCheck()
        }, firstCall ? 0 : app.options.lockCheckInterval || 100)
        logger.debug({ tag: 'lock.ts', sessionId, msg: [`Requesting to read table '${self.name}'`] })
      })(true)
    })
    logger.debug({ tag: 'lock.ts', sessionId, msg: [`Start reading table '${self.name}'`] })
    return this
  }

  /**
   * Release reading lock
   * @param sessionId [string]
   */
  public releaseRead(sessionId: string) {
    const index = this.reading.indexOf(sessionId)
    if (index > -1) this.reading.splice(index, 1)
  }

  /**
   * Request for writing
   * @param sessionId [string]
   */
  public async write(sessionId: string): Promise<TableLock> {
    // closed, no new request
    if (this.isClosed) {
      throw new Error(`Table '${this.name}' does not exist`)
    }

    // wait writing
    this.requestingWrite.push(sessionId)
    const self = this
    await new Promise(resolve => {
      (function waitAndCheck(firstCall = false) {
        setTimeout(() => {
          if (self.writeEnabled && self.requestingWrite[0] === sessionId) {
            self.requestingWrite.shift()
            self.writing.push(sessionId)
            return resolve()
          }
          waitAndCheck()
        }, firstCall ? 0 : app.options.lockCheckInterval || 100)
        logger.debug({ tag: 'lock.ts', sessionId, msg: [`Requesting to write table '${self.name}'`] })
      })(true)
    })
    logger.debug({ tag: 'lock.ts', sessionId, msg: [`Start writing table '${self.name}'`] })
    return this
  }

  /**
   * Release writing lock
   * @param sessionId [string]
   */
  public releaseWrite(sessionId: string) {
    if (this.writing[0] === sessionId) {
      this.writing.shift()
    }
  }

  /**
   * Whether the table is deleted
   */
  public async close(sessionId: string): Promise<TableLock> {
    const promise = this.write(sessionId)
    this.isClosed = true
    await promise
    logger.debug({ tag: 'lock.ts', sessionId, msg: [`Table '${this.name}' closed`] })
    return this
  }
}
