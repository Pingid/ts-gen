# ts-gen

A TypeScript utility library for dynamically generating TypeScript type ASTs from JavaScript values. Useful for generating typescript types from collections of unstructured data.

## Installation

Install `ts-gen` using npm:

```bash
npm install ts-gen
```

Or using yarn:

```bash
yarn add ts-gen
```

## Usage

Import and use `ts-gen` in your TypeScript projects:

```typescript
import { inferTypeAst, combineAstNode } from 'ts-gen';

// Example: infer type from a value
const typeNode = inferTypeAst(\"Hello, World!\");
console.log(typeNode);

// Example: combine type AST nodes
const numberType = inferTypeAst(42);
const stringType = inferTypeAst(\"hello\");
const combinedType = combineAstNode(numberType, stringType);
console.log(combinedType);
```

## API

### `inferTypeAst(value: any): ts.TypeNode`

Generates a TypeScript type node that corresponds to the given JavaScript value.

### `combineAstNode(a: ts.TypeNode, b: ts.TypeNode): ts.TypeNode`

Combines two type AST nodes into a more complex type, handling unions, arrays, and object types.

## License

Distributed under the MIT License. See `LICENSE` file for more information.
