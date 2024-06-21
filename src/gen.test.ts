import ts from 'typescript'
import { test, expect } from 'vitest'

import { combineAstNode, inferTypeAst } from './index.js'

test('combine primitives', () => {
  const input = ['foo', 10, true, null, undefined]
  const result = 'string | number | boolean | null | undefined'
  expectMatch(input, result)
})

test('combine arrays', () => {
  const input = [['foo'], [10]]
  const result = '(string | number)[]'
  expectMatch(input, result)
})

test('combine empty arrays', () => {
  const input = [['foo'], [1], []]
  const result = '(string | number)[]'
  expectMatch(input, result)
})

test('combing record', () => {
  const input = [{ one: 'foo' }, { one: 10 }]
  const result = `{
    one: string | number;
  }`
  expectMatch(input, result)
})

test('combing record with empty', () => {
  const input = [{ one: 'foo' }, {}]
  const result = `{
    one?: string;
  }`
  expectMatch(input, result)
})

test('combing nested record', () => {
  const input = [{ one: 'foo', two: { foo: 'bar' } }, { two: { foo: 10, bar: true } }]
  const result = `{
    one?: string;
    two: {
        foo: string | number;
        bar?: boolean;
    };
  }`
  expectMatch(input, result)
})

const expectMatch = (items: any[], output: string) => {
  const tp = items.map(inferTypeAst).reduce(combineAstNode)
  const file = ts.createSourceFile('test.ts', '', ts.ScriptTarget.ESNext, true)
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const result = printer.printNode(ts.EmitHint.Unspecified, tp, file)
  expect(output.trim().replace(/\n\s{2,}\}$/, '\n}')).toBe(result)
}
