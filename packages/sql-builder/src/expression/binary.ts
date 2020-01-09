import _ = require('lodash')
import { Expression } from '.'
import { dbConfigs, dbType } from '../dbType'
import { IBuilder, IExpression } from '../index.if'
import { parse, register } from '../parse'
import { ColumnExpression } from './column'
import { IBinaryExpression, IValue } from './index.if'
import { isUnknown, Unknown } from './unknown'
import { Value } from './value'
import { Variable } from './variable'

/**
 * Default set of operators supported, based on mysql
 */
const DEFAULT_OPERATORS = [
  '=',
  '<>',
  '<',
  '<=',
  '>',
  '>=',
  ':=',
  'IN',
  'IS',
  'LIKE',
  'REGEXP',
]

class Builder implements IBuilder<BinaryExpression> {
  private json: IBinaryExpression

  constructor(operator: string) {
    const SUPPORTED_OPERATORS = _.get(dbConfigs, [dbType, 'binaryOperators'], DEFAULT_OPERATORS)
    if (SUPPORTED_OPERATORS.indexOf(operator) === -1) throw new SyntaxError(`Unsupported operator '${operator}'`)

    this.json = {
      classname: BinaryExpression.name,
      operator,
    }
  }

  /**
   * Set `left` expression
   * @param json [IExpression|string]
   */
  public left(json: IExpression|string): Builder {
    if (typeof json === 'string') json = this.json.operator === ':=' ? new Variable(json) : new ColumnExpression(json)

    // check := operator
    if (this.json.operator === ':=' && json.classname !== 'Variable') {
      throw new SyntaxError(`Left expression must be variable for operator ':='`)
    }

    this.json.left = json
    return this
  }

  /**
   * Set `not` flag
   * @param value [boolean]
   */
  public not(value: boolean = true): Builder {
    switch (this.json.operator) {
      case 'IS':
        this.right(new Value(null))
      case 'IN':
      case 'LIKE':
      case 'REGEXP':
        this.json.not = value
        break
      default:
        if (value) throw new SyntaxError(`Invalid use of \`not\` flag with operator '${this.json.operator}'`)
    }
    return this
  }

  /**
   * Set `right` expression
   * @param json [IExpression|string]
   */
  public right(json: IExpression|string): Builder {
    if (typeof json === 'string') json = new ColumnExpression(json)

    // check IS NULL
    if (this.json.operator === 'IS') {
      throw new SyntaxError(`Right expression is fixed to be NULL for operator 'IS'`)
    }
    // check IN
    else if (this.json.operator === 'IN' && (json.classname !== 'Value' || !Array.isArray((json as IValue).value)) && json.classname !== 'QueryExpression') {
      throw new SyntaxError(`Right expression must be array value or Query for operator 'IN'`)
    }
    // check LIKE or REGEXP
    else if ((this.json.operator === 'LIKE' || this.json.operator === 'REGEXP') && (json.classname !== 'Value' || typeof (json as IValue).value !== 'string')) {
      throw new SyntaxError(`Right expression must be string value for operator '${this.json.operator}'`)
    }

    this.json.right = json
    return this
  }

  // @override
  public build(): BinaryExpression {
    return new BinaryExpression(this.json)
  }

  // @override
  public toJson(): IBinaryExpression {
    return _.cloneDeep(this.json)
  }
}

/**
 * [left] (NOT) [operator] [right]
 */
export class BinaryExpression extends Expression implements IBinaryExpression {
  public static Builder = Builder

  public readonly classname: string = BinaryExpression.name
  public readonly left: Expression = new Unknown()
  public readonly not: boolean = false
  public readonly operator: string
  public readonly right: Expression = new Unknown()

  constructor(json: IBinaryExpression) {
    super()
    if (json.left) this.left = parse(json.left)
    if (json.not) this.not = json.not
    this.operator = json.operator
    if (json.right) this.right = parse(json.right)
  }

  // @override
  public toJson(): IBinaryExpression {
    const json: IBinaryExpression = {
      classname: this.classname,
      operator: this.operator,
    }
    if (!isUnknown(this.left)) json.left = this.left.toJson()
    if (this.not) json.not = this.not
    if (!isUnknown(this.right)) json.right = this.right.toJson()
    return json
  }
}

register(BinaryExpression)