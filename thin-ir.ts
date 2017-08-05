import * as js from './emit-js';

export const compileToJS = js.compile;

export enum Type {
  Void,
  I32,
}

export enum Kind {
  Void_Call,
  Void_CallImport,
  Void_Const,

  I32_Const,
  I32_Load,
  I32_Load8S,
  I32_Load8U,
  I32_Load16S,
  I32_Load16U,
  I32_LoadLocal,

  I32_Store,
  I32_Store8,
  I32_Store16,
  I32_StoreLocal,

  I32_Add,
  I32_And,
  I32_DivS,
  I32_DivU,
  I32_Eq,
  I32_Ge,
  I32_Gt,
  I32_Le,
  I32_Lt,
  I32_Mul,
  I32_Ne,
  I32_Or,
  I32_RemS,
  I32_RemU,
  I32_Shl,
  I32_ShrS,
  I32_ShrU,
  I32_Sub,
  I32_Xor,

  I32_Call,
  I32_CallImport,
  I32_Select,

  Flow_Block,
  Flow_If,
  Flow_Loop,
  Flow_Return,
}

export interface Node {
  kind: Kind;
  value: number;
  children: Node[];
}

export interface Function {
  name: string;
  id: number;
  localI32s: number;
  isExported: boolean;
  argTypes: Type[];
  returnType: Type;
  body: Node;
}

export interface Import {
  location: string;
  name: string;
  id: number;
  argTypes: Type[];
  returnType: Type;
}

export interface Module {
  data: Uint8Array;
  imports: Import[];
  functions: Function[];
}

export function void_call(id: number, args: Node[]): Node {
  return {
    kind: Kind.Void_Call,
    value: id,
    children: args,
  };
}

export function void_callImport(id: number, args: Node[]): Node {
  return {
    kind: Kind.Void_CallImport,
    value: 0,
    children: args,
  };
}

export function void_const(): Node {
  return {
    kind: Kind.Void_Const,
    value: 0,
    children: [],
  };
}

export function i32_const(value: number): Node {
  return {
    kind: Kind.I32_Const,
    value: value,
    children: [],
  };
}

export function i32_load(address: Node, offset: number): Node {
  return {
    kind: Kind.I32_Load,
    value: offset,
    children: [address],
  };
}

export function i32_load8S(address: Node, offset: number): Node {
  return {
    kind: Kind.I32_Load8S,
    value: offset,
    children: [address],
  };
}

export function i32_load8U(address: Node, offset: number): Node {
  return {
    kind: Kind.I32_Load8U,
    value: offset,
    children: [address],
  };
}

export function i32_load16S(address: Node, offset: number): Node {
  return {
    kind: Kind.I32_Load16S,
    value: offset,
    children: [address],
  };
}

export function i32_load16U(address: Node, offset: number): Node {
  return {
    kind: Kind.I32_Load16U,
    value: offset,
    children: [address],
  };
}

export function i32_loadLocal(index: number): Node {
  return {
    kind: Kind.I32_LoadLocal,
    value: index,
    children: [],
  };
}

export function i32_store(address: Node, offset: number, value: Node): Node {
  return {
    kind: Kind.I32_Store,
    value: offset,
    children: [address, value],
  };
}

export function i32_store8(address: Node, offset: number, value: Node): Node {
  return {
    kind: Kind.I32_Store8,
    value: offset,
    children: [address, value],
  };
}

export function i32_store16(address: Node, offset: number, value: Node): Node {
  return {
    kind: Kind.I32_Store16,
    value: offset,
    children: [address, value],
  };
}

export function i32_storeLocal(index: number, value: Node): Node {
  return {
    kind: Kind.I32_StoreLocal,
    value: index,
    children: [value],
  };
}

export function i32_add(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Add,
    value: 0,
    children: [left, right],
  };
}

export function i32_and(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_And,
    value: 0,
    children: [left, right],
  };
}

export function i32_divS(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_DivS,
    value: 0,
    children: [left, right],
  };
}

export function i32_divU(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_DivU,
    value: 0,
    children: [left, right],
  };
}

export function i32_eq(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Eq,
    value: 0,
    children: [left, right],
  };
}

export function i32_ge(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Ge,
    value: 0,
    children: [left, right],
  };
}

export function i32_gt(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Gt,
    value: 0,
    children: [left, right],
  };
}

export function i32_le(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Le,
    value: 0,
    children: [left, right],
  };
}

export function i32_lt(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Lt,
    value: 0,
    children: [left, right],
  };
}

export function i32_mul(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Mul,
    value: 0,
    children: [left, right],
  };
}

export function i32_ne(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Ne,
    value: 0,
    children: [left, right],
  };
}

export function i32_or(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Or,
    value: 0,
    children: [left, right],
  };
}

export function i32_remS(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_RemS,
    value: 0,
    children: [left, right],
  };
}

export function i32_remU(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_RemU,
    value: 0,
    children: [left, right],
  };
}

export function i32_shl(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Shl,
    value: 0,
    children: [left, right],
  };
}

export function i32_shrS(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_ShrS,
    value: 0,
    children: [left, right],
  };
}

export function i32_shrU(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_ShrU,
    value: 0,
    children: [left, right],
  };
}

export function i32_sub(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Sub,
    value: 0,
    children: [left, right],
  };
}

export function i32_xor(left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Xor,
    value: 0,
    children: [left, right],
  };
}

export function i32_call(id: number, args: Node[]): Node {
  return {
    kind: Kind.I32_Call,
    value: id,
    children: args,
  };
}

export function i32_callImport(id: number, args: Node[]): Node {
  return {
    kind: Kind.I32_CallImport,
    value: id,
    children: args,
  };
}

export function i32_select(test: Node, left: Node, right: Node): Node {
  return {
    kind: Kind.I32_Select,
    value: 0,
    children: [test, left, right],
  };
}

export function flow_block(children: Node[]): Node {
  return {
    kind: Kind.Flow_Block,
    value: 0,
    children: children,
  };
}

export function flow_if(test: Node, left: Node, right?: Node): Node {
  return {
    kind: Kind.Flow_If,
    value: 0,
    children: [test, left, right || void_const()],
  };
}

export function flow_loop(test: Node, body: Node): Node {
  return {
    kind: Kind.Flow_Loop,
    value: 0,
    children: [test, body],
  };
}

export function flow_return(value?: Node): Node {
  return {
    kind: Kind.Flow_Return,
    value: 0,
    children: [value || void_const()],
  };
}

export function typeOf(kind: Kind): Type {
  switch (kind) {
    case Kind.Void_Call:
    case Kind.Void_CallImport:
    case Kind.Void_Const: {
      return Type.Void;
    }

    case Kind.I32_Const:
    case Kind.I32_Load:
    case Kind.I32_Load8S:
    case Kind.I32_Load8U:
    case Kind.I32_Load16S:
    case Kind.I32_Load16U:
    case Kind.I32_LoadLocal:

    case Kind.I32_Store:
    case Kind.I32_Store8:
    case Kind.I32_Store16:
    case Kind.I32_StoreLocal:

    case Kind.I32_Add:
    case Kind.I32_And:
    case Kind.I32_DivS:
    case Kind.I32_DivU:
    case Kind.I32_Eq:
    case Kind.I32_Ge:
    case Kind.I32_Gt:
    case Kind.I32_Le:
    case Kind.I32_Lt:
    case Kind.I32_Mul:
    case Kind.I32_Ne:
    case Kind.I32_Or:
    case Kind.I32_RemS:
    case Kind.I32_RemU:
    case Kind.I32_Shl:
    case Kind.I32_ShrS:
    case Kind.I32_ShrU:
    case Kind.I32_Sub:
    case Kind.I32_Xor:

    case Kind.I32_Call:
    case Kind.I32_CallImport:
    case Kind.I32_Select: {
      return Type.I32;
    }

    case Kind.Flow_Block:
    case Kind.Flow_If:
    case Kind.Flow_Loop:
    case Kind.Flow_Return: {
      return Type.Void;
    }
  }

  throw internalError(kind, 'Unexpected kind');
}

function isNonNegativeInteger(value: number): boolean {
  return value === (value >>> 0);
}

function internalError(value: never, error: string): Error {
  return new Error(error);
}

export interface Mapping {
  imports: {[id: number]: Import};
  functions: {[id: number]: Function};
}

function validateNode(mapping: Mapping, item: Function, {kind, value, children}: Node, type: Type | null): void {
  const expectedType = typeOf(kind);

  if (type !== null && expectedType !== type) {
    throw new Error(`Function ${item.name}: Cannot use ${Kind[kind]} in context expecting ${Type[type]}`);
  }

  switch (kind) {
    case Kind.Void_Const: {
      if (children.length !== 0) {
        throw new Error(`Function ${item.name}: Invalid node: ${Kind[kind]}`);
      }
      break;
    }

    case Kind.I32_Const: {
      if (!isNonNegativeInteger(value) && value !== (value | 0)) {
        throw new Error(`Function ${item.name}: Invalid constant: ${value}`);
      }
      break;
    }

    case Kind.I32_Load:
    case Kind.I32_Load8S:
    case Kind.I32_Load8U:
    case Kind.I32_Load16S:
    case Kind.I32_Load16U: {
      if (children.length !== 1) {
        throw new Error(`Function ${item.name}: Invalid node: ${Kind[kind]}`);
      }

      if (!isNonNegativeInteger(value)) {
        throw new Error(`Function ${item.name}: Invalid offset: ${value}`);
      }

      validateNode(mapping, item, children[0], Type.I32);
      break;
    }

    case Kind.I32_LoadLocal: {
      if (children.length !== 0) {
        throw new Error(`Function ${item.name}: Invalid node: ${Kind[kind]}`);
      }

      if (!isNonNegativeInteger(value) || value >= item.argTypes.length + item.localI32s) {
        throw new Error(`Function ${item.name}: Invalid local index: ${value}`);
      }
      break;
    }

    case Kind.I32_Store:
    case Kind.I32_Store8:
    case Kind.I32_Store16: {
      if (children.length !== 2) {
        throw new Error(`Function ${item.name}: Invalid node: ${Kind[kind]}`);
      }

      if (!isNonNegativeInteger(value)) {
        throw new Error(`Function ${item.name}: Invalid offset: ${value}`);
      }

      validateNode(mapping, item, children[0], Type.I32);
      validateNode(mapping, item, children[1], Type.I32);
      break;
    }

    case Kind.I32_StoreLocal: {
      if (children.length !== 1) {
        throw new Error(`Function ${item.name}: Invalid node: ${Kind[kind]}`);
      }

      if (!isNonNegativeInteger(value) || value >= item.argTypes.length + item.localI32s) {
        throw new Error(`Function ${item.name}: Invalid local index: ${value}`);
      }

      validateNode(mapping, item, children[0], Type.I32);
      break;
    }

    case Kind.I32_Add:
    case Kind.I32_And:
    case Kind.I32_DivS:
    case Kind.I32_DivU:
    case Kind.I32_Eq:
    case Kind.I32_Ge:
    case Kind.I32_Gt:
    case Kind.I32_Le:
    case Kind.I32_Lt:
    case Kind.I32_Mul:
    case Kind.I32_Ne:
    case Kind.I32_Or:
    case Kind.I32_RemS:
    case Kind.I32_RemU:
    case Kind.I32_Shl:
    case Kind.I32_ShrS:
    case Kind.I32_ShrU:
    case Kind.I32_Sub:
    case Kind.I32_Xor: {
      if (children.length !== 2) {
        throw new Error(`Function ${item.name}: Invalid node: ${Kind[kind]}`);
      }

      validateNode(mapping, item, children[0], Type.I32);
      validateNode(mapping, item, children[1], Type.I32);
      break;
    }

    case Kind.Void_Call:
    case Kind.I32_Call: {
      if (!(value in mapping.functions)) {
        throw new Error(`Function ${item.name}: Invalid function id: ${value}`);
      }

      const {argTypes, returnType} = mapping.functions[value];

      if (children.length !== argTypes.length) {
        throw new Error(`Function ${item.name}: Invalid function call: expected ${argTypes.length} arguments, got ${children.length} instead`);
      }

      for (let i = 0; i < children.length; i++) {
        validateNode(mapping, item, children[i], argTypes[i]);
      }

      if (returnType !== expectedType) {
        throw new Error(`Function ${item.name}: Invalid function call: expected return type of ${Type[expectedType]}, got ${Type[returnType]} instead`);
      }
      break;
    }

    case Kind.Void_CallImport:
    case Kind.I32_CallImport: {
      if (!(value in mapping.imports)) {
        throw new Error(`Function ${item.name}: Invalid import id: ${value}`);
      }

      const {argTypes, returnType} = mapping.imports[value];

      if (children.length !== argTypes.length) {
        throw new Error(`Function ${item.name}: Invalid import call: expected ${argTypes.length} arguments, got ${children.length} instead`);
      }

      for (let i = 0; i < children.length; i++) {
        validateNode(mapping, item, children[i], argTypes[i]);
      }

      if (returnType !== expectedType) {
        throw new Error(`Function ${item.name}: Invalid function call: expected return type of ${Type[expectedType]}, got ${Type[returnType]} instead`);
      }
      break;
    }

    case Kind.I32_Select: {
      if (children.length !== 3) {
        throw new Error(`Function ${item.name}: Invalid node: ${Kind[kind]}`);
      }

      validateNode(mapping, item, children[0], Type.I32);
      validateNode(mapping, item, children[1], Type.I32);
      validateNode(mapping, item, children[2], Type.I32);
      break;
    }

    case Kind.Flow_Block: {
      for (const child of children) {
        validateNode(mapping, item, child, null);
      }
      break;
    }

    case Kind.Flow_If: {
      if (children.length !== 3) {
        throw new Error(`Function ${item.name}: Invalid node: ${Kind[kind]}`);
      }

      validateNode(mapping, item, children[0], Type.I32);
      validateNode(mapping, item, children[1], null);
      validateNode(mapping, item, children[2], null);
      break;
    }

    case Kind.Flow_Loop: {
      if (children.length !== 2) {
        throw new Error(`Function ${item.name}: Invalid node: ${Kind[kind]}`);
      }

      validateNode(mapping, item, children[0], Type.I32);
      validateNode(mapping, item, children[1], null);
      break;
    }

    case Kind.Flow_Return: {
      if (children.length !== 1) {
        throw new Error(`Function ${item.name}: Invalid node: ${Kind[kind]}`);
      }

      validateNode(mapping, item, children[0], item.returnType);
      break;
    }

    default: {
      throw internalError(kind, `Function ${item.name}: Unexpected node`);
    }
  }
}

export function validate(module: Module): Mapping {
  const imports: {[id: number]: Import} = Object.create(null);

  for (const item of module.imports) {
    if (!isNonNegativeInteger(item.id)) {
      throw new Error(`Import ${item.name}: Invalid id: ${item.id}`);
    }

    if (item.id in imports) {
      throw new Error(`Import ${item.name}: Duplicate id: ${item.id}`);
    }

    for (const argType of item.argTypes) {
      if (argType === Type.Void) {
        throw new Error(`Import ${item.name}: Invalid argument type: ${argType}`);
      }
    }

    imports[item.id] = item;
  }

  const functionNames: {[name: string]: boolean} = Object.create(null);
  const functions: {[id: number]: Function} = Object.create(null);

  for (const item of module.functions) {
    if (item.name in functionNames) {
      throw new Error(`Function ${item.name}: Duplicate name: ${item.name}`);
    }

    if (!isNonNegativeInteger(item.id)) {
      throw new Error(`Function ${item.name}: Invalid id: ${item.id}`);
    }

    if (item.id in functions) {
      throw new Error(`Function ${item.name}: Duplicate id: ${item.id}`);
    }

    if (!isNonNegativeInteger(item.localI32s)) {
      throw new Error(`Function ${item.name}: Invalid localI32s: ${item.localI32s}`);
    }

    for (const argType of item.argTypes) {
      if (argType === Type.Void) {
        throw new Error(`Function ${item.name}: Invalid argument type: ${argType}`);
      }
    }

    functionNames[item.name] = true;
    functions[item.id] = item;
  }

  const mapping: Mapping = {imports, functions};

  for (const item of module.functions) {
    validateNode(mapping, item, item.body, null);
  }

  return mapping;
}
