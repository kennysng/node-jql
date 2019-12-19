import { JQL } from '../../../jql'
import { Type } from '../../../jql/index.if'
import { IColumnDef } from './index.if'

/**
 * Column definition
 */
export class ColumnDef<T = Type> extends JQL implements IColumnDef<T> {
  // @override
  public readonly classname = ColumnDef.name

  // @override
  public name: string

  // @override
  public type: T

  // @override
  public length?: number

  // @override
  public primaryKey = false

  // @override
  public defaultValue: any = null

  // @override
  public notNull = false

  // @override
  public autoIncrement = false

  // @override
  public options: string[] = []

  constructor(json?: IColumnDef<T>) {
    super()

    if (json) {
      this.setColumn(json.name, json.type, json.length)
      if (json.primaryKey) this.setPrimaryKey()
      if (json.notNull) this.setNotNull()
      if (json.autoIncrement) this.setAutoIncrement()
    }
  }

  /**
   * Set column definition
   * @param name [string]
   * @param type [Type]
   */
  public setColumn(name: string, type: T, length?: number): ColumnDef<T> {
    this.name = name
    this.type = type
    this.length = length
    return this
  }

  /**
   * Set PRIMARY KEY flag
   * @param flag [boolean]
   */
  public setPrimaryKey(flag = true): ColumnDef<T> {
    this.primaryKey = flag
    this.setNotNull()
    return this
  }

  /**
   * Set NOT NULL flag
   * @param flag [boolean]
   */
  public setNotNull(flag?: true): ColumnDef<T>

  /**
   * Set DEFAULT value
   * @param flag [boolean]
   * @param defaultValue [any]
   */
  public setNotNull(flag: false, defaultValue: any): ColumnDef<T>

  public setNotNull(flag = true, defaultValue: any = null): ColumnDef<T> {
    if (!flag && this.primaryKey) {
      throw new SyntaxError('PRIMAYR KEY column cannot be null')
    }
    this.notNull = flag
    this.defaultValue = defaultValue
    return this
  }

  /**
   * Set AUTO_INCREMENT flag
   * @param flag [boolean]
   */
  public setAutoIncrement(flag = true): ColumnDef<T> {
    this.autoIncrement = flag
    return this
  }

  /**
   * Add extra option
   * @param option [string]
   */
  public addOption(option: string): ColumnDef<T> {
    this.options.push(option)
    return this
  }

  // @override
  public toJson(): IColumnDef<T> {
    this.check()
    return {
      classname: this.classname,
      name: this.name,
      type: this.type,
      length: this.length,
      primaryKey: this.primaryKey,
      defaultValue: this.defaultValue,
      notNull: this.notNull,
      autoIncrement: this.autoIncrement,
      options: this.options,
    }
  }

  // @override
  public toString(): string {
    this.check()
    let result = `\`${this.name}\` ${this.type}`
    if (this.length !== undefined) result += `(${this.length})`
    if (this.primaryKey) result += ' PRIMARY KEY'
    result += this.notNull ? ' NOT NULL' : ` DEFAULT ${JSON.stringify(this.defaultValue)}`
    if (this.autoIncrement) result += ' AUTO_INCREMENT'
    for (const o of this.options) result += ` ${o}`
    return result
  }

  // @override
  protected check(): void {
    if (!this.name) throw new SyntaxError('Column name is not defined')
  }
}