import squel = require('squel')
import { ConditionalExpression, Expression, IConditionalExpression, IExpression } from '.'
import { JQLError } from '../utils/error'
import { parse } from './parse'

export type BinaryOperator = '='|'<>'|'<'|'<='|'>'|'>='

export interface IBinaryExpression extends IConditionalExpression {
  left: any
  operator: BinaryOperator
  right: any
}

export class BinaryExpression extends ConditionalExpression implements IBinaryExpression {
  public readonly classname = 'BinaryExpression'
  public left: Expression
  public operator: BinaryOperator
  public right: Expression

  constructor(expr: IBinaryExpression) {
    super()
    try {
      this.left = parse(expr.left)
      this.operator = expr.operator
      this.right = parse(expr.right)
    }
    catch (e) {
      throw new JQLError('InstantiateError: Fail to instantiate BinaryExpression', e)
    }
  }

  get template(): string {
    return `? ${this.operator} ?`
  }

  // @override
  public validate(availableTables: string[]) {
    this.left.validate(availableTables)
    this.right.validate(availableTables)
  }

  // @override
  public toSquel(): squel.Expression {
    return squel.expr()
      .and(
        this.template,
        this.left.toSquel(),
        this.right.toSquel(),
      )
  }
}
