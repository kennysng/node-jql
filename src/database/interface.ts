import { ResultSet } from './cursor/resultset'
import { JQLFunction } from './function'

// datarow structure
export type RawRow = { [key in string]: any }
export type Row = { [key in symbol]: any }

// datasource structure
export type DataSource = {
  [key in symbol]: {  // database-level
    [key in symbol]:  // table-level
      Row[]           // rows
  }
}

// temporary variable in a transaction
export type Variable = string|ResultSet|JQLFunction

// variable definition
export class VariableDef {
  public symbol: symbol

  constructor(readonly name: string) {
    this.symbol = Symbol(name)
  }
}

// options for database
export interface IDatebaseOptions {
  logLevels?: string
}

// default options for database
export const defaultOptions: IDatebaseOptions = {
  logLevels: 'DEBUG,INFO,WARN,ERROR'
}

// default options for database in production
export const defaultProdOptions: IDatebaseOptions = {
  logLevels: 'WARN,ERROR'
}