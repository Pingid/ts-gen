import ts from 'typescript'

export const inferTypeAst = (value: any): ts.TypeNode => {
  if (typeof value === 'string') return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
  if (typeof value === 'number') return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
  if (typeof value === 'boolean') return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
  if (typeof value === 'undefined') return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
  if (value === null) return ts.factory.createNull() as any
  if (value instanceof Date) return ts.factory.createTypeReferenceNode('Date', [])
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return ts.factory.createArrayTypeNode(ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword))
    }
    const tp = value.map((x) => inferTypeAst(x)).reduce(combineAstNode)
    return ts.factory.createArrayTypeNode(tp)
  }
  if (typeof value === 'object') {
    const members = Object.keys(value).map((key) =>
      ts.factory.createPropertySignature(undefined, key, undefined, inferTypeAst(value[key])),
    )
    return ts.factory.createTypeLiteralNode(members)
  }
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
}

export const combineAstNode = (a: ts.TypeNode, b: ts.TypeNode): ts.TypeNode => {
  // Exclude unknown when combining
  if (a.kind === ts.SyntaxKind.UnknownKeyword) return b
  if (b.kind === ts.SyntaxKind.UnknownKeyword) return a

  // Unionise record nodes
  if (ts.isTypeLiteralNode(a) && ts.isTypeLiteralNode(b)) {
    return ts.factory.createTypeLiteralNode(combineMembers(a.members as any, b.members as any))
  }

  // Unionise array nodes
  if (ts.isArrayTypeNode(a) && ts.isArrayTypeNode(b)) {
    return ts.factory.createArrayTypeNode(combineAstNode(a.elementType, b.elementType))
  }

  if (a.kind === b.kind) return a
  if (ts.isUnionTypeNode(a) && a.types.some((y) => y.kind === b.kind)) return a
  const a_elements = ts.isUnionTypeNode(b) ? [...b.types] : [b]
  const b_elements = ts.isUnionTypeNode(a) ? [...a.types] : [a]
  return ts.factory.createUnionTypeNode([...b_elements, ...a_elements])
}

const combineMembers = (a: ts.PropertySignature[], b: ts.PropertySignature[]) => {
  // Handle optional values
  const results = a.map((x) => {
    if (b.some((y) => getPropertyName(x.name) === getPropertyName(y.name))) return x
    return ts.factory.createPropertySignature(
      x.modifiers,
      x.name,
      ts.factory.createToken(ts.SyntaxKind.QuestionToken),
      x.type,
    )
  })

  for (const be of b) {
    const existing_index = a.findIndex((x) => getPropertyName(x.name) === getPropertyName(be.name))
    if (existing_index === -1) {
      results.push(
        ts.factory.createPropertySignature(
          be.modifiers,
          be.name,
          ts.factory.createToken(ts.SyntaxKind.QuestionToken),
          be.type,
        ),
      )
    } else {
      results[existing_index] = combinePropertySignatures(results[existing_index], be)
    }
  }

  return results
}

const combinePropertySignatures = (a: ts.PropertySignature, b: ts.PropertySignature) => {
  if (!a.type || !b.type) throw new Error(`Property signature missing type`)
  return ts.factory.createPropertySignature(undefined, a.name, undefined, combineAstNode(a.type, b.type))
}

const getPropertyName = (x?: ts.PropertyName) => (x?.kind === ts.SyntaxKind.Identifier ? x.text : undefined)
