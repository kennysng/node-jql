/* tslint:disable:no-console */

import { BinaryExpression } from './expression/binary'
import { ColumnExpression } from './expression/column'
import { FunctionExpression } from './expression/function'
import { InExpression } from './expression/in'
import { Value } from './expression/value'
import { Query } from './query'
import { JoinClause } from './query/joinClause'
import { OrderingTerm } from './query/orderingTerm'
import { ResultColumn } from './query/resultColumn'
import { JoinedTableOrSubquery } from './query/tableOrSubquery'

test('SELECT `*` FROM Student', () => {
  const query = new Query({ $from: 'Student' })
  query.validate()
  expect(query.toString()).toBe('SELECT `*` FROM Student')
})

test('SELECT `*` FROM Student WHERE (`gender` = \'F\') ORDER BY `id` ASC', () => {
  const query = new Query({
    $from: 'Student',
    $where: new BinaryExpression({
      left: new ColumnExpression('gender'),
      operator: '=',
      right: 'F',
    }),
    $order: new OrderingTerm({ expression: new ColumnExpression('id') }),
  })
  query.validate()
  expect(query.toString()).toBe('SELECT `*` FROM Student WHERE (`gender` = \'F\') ORDER BY `id` ASC')
})

test('SELECT `c`.`name` FROM Student `s` LEFT JOIN Class `c` ON (`c`.`studentId` = `s`.`id`) WHERE (`s`.`name` = \'Kennys Ng\') ORDER BY `c`.`year` DESC LIMIT 1', () => {
  const query = new Query({
    $select: new ResultColumn({ expression: new ColumnExpression(['c', 'name']) }),
    $from: new JoinedTableOrSubquery({
      table: 'Student',
      $as: 's',
      joinClauses: new JoinClause({
        operator: 'LEFT',
        tableOrSubquery: ['Class', 'c'],
        $on: new BinaryExpression({
          left: new ColumnExpression(['c', 'studentId']),
          operator: '=',
          right: new ColumnExpression(['s', 'id']),
        }),
      }),
    }),
    $where: new BinaryExpression({
      left: new ColumnExpression(['s', 'name']),
      operator: '=',
      right: 'Kennys Ng',
    }),
    $order: new OrderingTerm({
      expression: new ColumnExpression(['c', 'year']),
      order: 'DESC',
    }),
    $limit: { value: 1 },
  })
  query.validate()
  expect(query.toString()).toBe('SELECT `c`.`name` FROM Student `s` LEFT JOIN Class `c` ON (`c`.`studentId` = `s`.`id`) WHERE (`s`.`name` = \'Kennys Ng\') ORDER BY `c`.`year` DESC LIMIT 1')
})

test('SELECT COUNT(`*`) FROM Student WHERE (`id` IN (SELECT `studentId` FROM ClubStudent `cs` LEFT JOIN Club `c` ON (`c`.`id` = `cs`.`clubId`) WHERE (`c`.`name` = \'Science Club\')))', () => {
  const query = new Query({
    $select: new ResultColumn({
      expression: new FunctionExpression({
        name: 'COUNT',
        parameters: new ColumnExpression('*'),
      }),
    }),
    $from: 'Student',
    $where: new InExpression({
      left: new ColumnExpression('id'),
      right: new Query({
        $select: 'studentId',
        $from: new JoinedTableOrSubquery({
          table: 'ClubStudent',
          $as: 'cs',
          joinClauses: new JoinClause({
            operator: 'LEFT',
            tableOrSubquery: ['Club', 'c'],
            $on: new BinaryExpression({
              left: new ColumnExpression(['c', 'id']),
              operator: '=',
              right: new ColumnExpression(['cs', 'clubId']),
            }),
          }),
        }),
        $where: new BinaryExpression({
          left: new ColumnExpression(['c', 'name']),
          operator: '=',
          right: 'Science Club',
        }),
      }),
    }),
  })
  query.validate()
  expect(query.toString()).toBe('SELECT COUNT(`*`) FROM Student WHERE (`id` IN (SELECT `studentId` FROM ClubStudent `cs` LEFT JOIN Club `c` ON (`c`.`id` = `cs`.`clubId`) WHERE (`c`.`name` = \'Science Club\')))')
})

test('SELECT 1', () => {
  const query = new Query({
    $select: new ResultColumn({
      expression: new Value(1),
    }),
  })
  query.validate()
  expect(query.toString()).toBe('SELECT 1')
})