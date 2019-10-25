import { Query } from '..'
import { JQL } from '../..'
import { ColumnDef } from '../../create/table/column'
import { IColumnDef } from '../../create/table/index.if'
import { register } from '../../parse'
import { IQuery } from '../index.if'
import { IQueryTable, IRemoteTable, ISchemaTable, ITable } from './index.if'

/**
 * Table interface
 */
export abstract class Table extends JQL implements ITable {
  // @override
  public $as?: string
}

/**
 * {function}({schema}.{table})
 */
export class SchemaTable extends Table implements ISchemaTable {
  // @override
  public readonly classname = SchemaTable.name

  // @override
  public function?: string

  // @override
  public schema?: string

  // @override
  public table: string

  constructor(json?: string|ISchemaTable) {
    super()

    if (typeof json === 'string') {
      this.setTable(json)
    }
    else if (json) {
      if (json.function) {
        if (!json.$as) throw new SyntaxError('Missing alias name for table')
        this.setFunction(json.function, json.$as)
      }
      if (json.schema) {
        this.setTable(json.schema, json.table)
      }
      else {
        this.setTable(json.table)
      }
    }
  }

  /**
   * set table function
   * @param name [string]
   * @param $as [string]
   */
  public setFunction(name: string, $as: string): SchemaTable {
    this.function = name
    this.$as = $as
    return this
  }

  /**
   * set table
   * @param name [string]
   */
  public setTable(name: string): SchemaTable
  /**
   * set table
   * @param schema [string]
   * @param table [string]
   */
  public setTable(schema: string, table: string): SchemaTable
  public setTable(...args: any[]): SchemaTable {
    if (args.length === 1) {
      this.schema = undefined
      this.table = args[0] as string
    }
    else {
      this.schema = args[0] as string
      this.table = args[1] as string
    }
    return this
  }

  /**
   * set alias name
   * @param name [string]
   */
  public setAlias(name: string): SchemaTable {
    this.$as = name
    return this
  }

  // @override
  public toJson(): ISchemaTable {
    this.check()
    return {
      classname: this.classname,
      function: this.function,
      schema: this.schema,
      table: this.table,
      $as: this.$as,
    }
  }

  // @override
  public toString(): string {
    this.check()
    let table = `\`${this.table}\``
    if (this.schema) table = `\`${this.schema}\`.${table}`
    if (this.function) table = `${this.function}(${table})`
    if (this.$as) table = `${table} \`${this.$as}\``
    return table
  }

  // @override
  protected check(): void {
    if (this.function && !this.$as) throw new SyntaxError('Missing alias name for table')
  }
}

/**
 * Table from query
 */
export class QueryTable extends Table implements IQueryTable {
  // @override
  public readonly classname = QueryTable.name

  // @override
  public query: Query

  constructor(json?: IQueryTable) {
    super()

    if (json) {
      if (!json.$as) throw new SyntaxError('Alias name is required')
      this.setQuery(json.query, json.$as)
    }
  }

  /**
   * set query
   * @param query [IQuery]
   * @param $as [string]
   */
  public setQuery(query: IQuery, $as: string): QueryTable {
    this.query = new Query(query)
    this.$as = $as
    return this
  }

  // @override
  public toJson(): IQueryTable {
    this.check()
    return {
      classname: this.classname,
      query: this.query.toJson(),
      $as: this.$as,
    }
  }

  // @override
  public toString(): string {
    this.check()
    return `(${this.query.toString()}) \`${this.$as}\``
  }

  // @override
  protected check(): void {
    if (!this.query) throw new SyntaxError('Query is not defined')
    if (!this.$as) throw new SyntaxError('Missing alias name for table')
  }
}

/**
 * Table from API
 */
export class RemoteTable<R> extends Table implements IRemoteTable<R> {
  // @override
  public readonly classname = RemoteTable.name

  // @override
  public columns: ColumnDef[]

  // @override
  public requestConfig: R

  constructor(json?: IRemoteTable<R>) {
    super()

    if (json) {
      if (!json.$as) throw new SyntaxError('Alias name is required')
      this.setAPI(json.requestConfig, json.columns, json.$as)
    }
  }

  /**
   * set API configuration
   * @param config [Request]
   * @param columns [Array<IColumnDef>]
   * @param $as [string]
   */
  public setAPI(config: R, columns: IColumnDef[], $as: string): RemoteTable<R> {
    this.requestConfig = config
    this.columns = columns.map(c => new ColumnDef(c))
    this.$as = $as
    return this
  }

  // @override
  public toJson(): IRemoteTable<R> {
    return {
      classname: this.classname,
      columns: this.columns.map(c => c.toJson()),
      requestConfig: this.requestConfig,
      $as: this.$as,
    }
  }

  // @override
  public toString(): string {
    return `FETCH(${JSON.stringify(this.requestConfig)}) \`${this.$as}\``
  }

  // @override
  protected check(): void {
    if (!this.requestConfig) throw new SyntaxError('API configuration is not defined')
    if (!this.$as) throw new SyntaxError('Missing alias name for table')
  }
}

register(SchemaTable)
register(QueryTable)
register(RemoteTable)
