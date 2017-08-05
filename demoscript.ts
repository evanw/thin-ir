import * as thin from './thin-ir';

type NestedOp = 'def' | 'block' | 'if' | 'while' | 'return' | 'call' | 'select' | '=' | '||' | '&&' | '|' |
  '&' | '^' | '==' | '!=' | '<' | '>' | '<=' | '>=' | '<<' | '>>' | '+' | '-' | '*' | '/' | '%' | '.' | '[]';
type NestedAST = {op: NestedOp, args: AST[]};
type AST = {op: 'int', value: number} | {op: 'name', value: string} | NestedAST;

function parse(source: string): AST[] {
  const grammar = /([0-9]+|[A-Za-z_][A-Za-z0-9_]*|[<>=!]=|&&|\|\||<<|>>|'.'|[&\|\^\{\}\[\]\(\)\+\-\*\/%=<>?:;,.])/;
  const tokens = source.replace(/\/\/.*/g, '').split(grammar).filter((_, i) => i & 1);
  const tree: AST[] = [];
  let i = 0;

  function peek(token: RegExp | string): boolean {
    return token instanceof RegExp ? token.test(tokens[i]) : tokens[i] === token;
  }

  function eat(token: RegExp | string): boolean {
    if (peek(token)) { i++; return true; }
    return false;
  }

  function expect(token: RegExp | string): void {
    if (!eat(token)) throw new Error(`Expected ${token}, found ${JSON.stringify(tokens[i])}`);
  }

  function prefix(): AST {
    if (eat('(')) {
      const value = expression(0);
      expect(')');
      return value;
    }

    if (eat('def')) {
      const args = [prefix()];
      expect('(');
      while (!peek(')')) {
        args.push(expression(0));
        if (!eat(',')) break;
      }
      expect(')');
      args.push(expression(0));
      return {op: 'def', args};
    }

    if (eat('{')) {
      const args: AST[] = [];
      while (!peek('}')) args.push(expression(0));
      expect('}');
      return {op: 'block', args};
    }

    if (eat('if')) {
      expect('(');
      const args = [expression(0)];
      expect(')');
      args.push(expression(0));
      if (eat('else')) args.push(expression(0));
      return {op: 'if', args};
    }

    if (eat('while')) {
      expect('(');
      const args = [expression(0)];
      expect(')');
      args.push(expression(0));
      return {op: 'while', args};
    }

    if (eat('return')) {
      const value = expression(0);
      return {op: 'return', args: [value]};
    }

    if (eat(/^'.'$/)) return {op: 'int', value: tokens[i - 1].charCodeAt(1)};
    if (eat(/^[0-9]+$/)) return {op: 'int', value: parseInt(tokens[i - 1], 10)};
    if (eat(/^[A-Za-z_][A-Za-z0-9_]*$/)) return {op: 'name', value: tokens[i - 1]};
    throw new Error(`Unexpected ${JSON.stringify(tokens[i])}`);
  }

  function binary(node: AST, level: number, op: NestedOp, opLevel: number): AST {
    if (level >= opLevel) return node;
    i++;
    return {op, args: [node, expression(opLevel)]};
  }

  function infix(node: AST, level: number): AST {
    if (eat('(')) {
      const args: AST[] = [node];
      while (!peek(')')) {
        args.push(expression(0));
        if (!eat(',')) break;
      }
      expect(')');
      return {op: 'call', args};
    }

    if (level < 12 && eat('[')) {
      const value = expression(0);
      expect(']');
      return {op: '[]', args: [node, value]};
    }

    if (level <= 1 && eat('?')) {
      const left = expression(0);
      expect(':');
      const right = expression(0);
      return {op: 'select', args: [node, left, right]};
    }

    if (peek('=')) return binary(node, level, '=', 1);
    if (peek('||')) return binary(node, level, '||', 2);
    if (peek('&&')) return binary(node, level, '&&', 3);
    if (peek('|')) return binary(node, level, '|', 4);
    if (peek('&')) return binary(node, level, '&', 5);
    if (peek('^')) return binary(node, level, '^', 6);
    if (peek('==')) return binary(node, level, '==', 7);
    if (peek('!=')) return binary(node, level, '!=', 7);
    if (peek('<')) return binary(node, level, '<', 8);
    if (peek('>')) return binary(node, level, '>', 8);
    if (peek('<=')) return binary(node, level, '<=', 8);
    if (peek('>=')) return binary(node, level, '>=', 8);
    if (peek('<<')) return binary(node, level, '<<', 9);
    if (peek('>>')) return binary(node, level, '>>', 9);
    if (peek('+')) return binary(node, level, '+', 10);
    if (peek('-')) return binary(node, level, '-', 10);
    if (peek('*')) return binary(node, level, '*', 11);
    if (peek('/')) return binary(node, level, '/', 11);
    if (peek('%')) return binary(node, level, '%', 11);
    if (peek('.')) return binary(node, level, '.', 12);
    return node;
  }

  function expression(level: number): AST {
    let node = prefix();
    while (true) {
      const next = infix(node, level);
      if (next === node) break;
      node = next;
    }
    return node;
  }

  while (i < tokens.length) {
    tree.push(expression(0));
  }

  return tree;
}

function compile(ast: AST[], {memorySize}: {memorySize: number}): thin.Module {
  const imports: thin.Import[] = [];
  const functions: thin.Function[] = [];
  const secondPass: (() => void)[] = [];
  const importMap: {[name: string]: thin.Import} = Object.create(null);
  const functionMap: {[name: string]: thin.Function} = Object.create(null);
  const variableMap: {[name: string]: number} = Object.create(null);
  const globalScope: {[name: string]: boolean} = Object.create(null);
  const variables: number[] = [0];
  let nextFunctionID = 0;
  let nextImportID = 0;

  function compileGlobalVariable(node: NestedAST): void {
    const [left, right] = node.args;

    if (left.op !== 'name') throw new Error('Invalid variable name');
    if (right.op !== 'int') throw new Error('Must initialize global variables to constants');
    if (left.value in globalScope) throw new Error(`The global name ${JSON.stringify(left.value)} is already defined`);

    variableMap[left.value] = variables.length * 4;
    globalScope[left.value] = true;
    variables.push(right.value);
  }

  function compileGlobalFunction(node: NestedAST): void {
    const argMap: {[name: string]: number} = Object.create(null);
    const localMap: {[name: string]: number} = Object.create(null);
    const [name, ...args] = node.args;
    const body = args.pop()!;

    if (name.op !== 'name') throw new Error('Invalid function name');
    if (name.value in globalScope) throw new Error(`The global name ${JSON.stringify(name.value)} is already defined`);

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.op !== 'name') throw new Error('Invalid function argument');
      if (arg.value in globalScope) throw new Error(`The argument name ${JSON.stringify(arg.value)} is already defined globally`);
      if (arg.value in argMap) throw new Error(`The argument name ${JSON.stringify(arg.value)} is already defined`);
      argMap[arg.value] = i;
    }

    const fn: thin.Function = {
      name: name.value,
      id: ++nextFunctionID,
      argTypes: args.map(() => thin.Type.I32),
      returnType: thin.Type.I32,
      localI32s: 0,
      isExported: true,
      body: thin.flow_return(thin.i32_const(0)),
    };

    functions.push(fn);
    functionMap[fn.name] = fn;
    globalScope[name.value] = true;
    secondPass.push(() => fn.body = compileNode(body));

    function allocateLocal(name: string): number {
      if (!(name in localMap)) localMap[name] = fn.localI32s++;
      return localMap[name];
    }

    function computeAddress(node: AST): thin.Node {
      if (node.op === '[]') return thin.i32_add(compileNode(node.args[0]), compileNode(node.args[1]));
      if (node.op === '.') return thin.i32_add(compileNode(node.args[0]), thin.i32_shl(compileNode(node.args[1]), thin.i32_const(2)));
      return compileNode(node);
    }

    function compileNode(node: AST): thin.Node {
      switch (node.op) {
        case 'int': return thin.i32_const(node.value);
        case '+': return thin.i32_add(compileNode(node.args[0]), compileNode(node.args[1]));
        case '-': return thin.i32_sub(compileNode(node.args[0]), compileNode(node.args[1]));
        case '*': return thin.i32_mul(compileNode(node.args[0]), compileNode(node.args[1]));
        case '/': return thin.i32_divS(compileNode(node.args[0]), compileNode(node.args[1]));
        case '%': return thin.i32_remS(compileNode(node.args[0]), compileNode(node.args[1]));
        case '&': return thin.i32_and(compileNode(node.args[0]), compileNode(node.args[1]));
        case '|': return thin.i32_or(compileNode(node.args[0]), compileNode(node.args[1]));
        case '^': return thin.i32_xor(compileNode(node.args[0]), compileNode(node.args[1]));
        case '<<': return thin.i32_shl(compileNode(node.args[0]), compileNode(node.args[1]));
        case '>>': return thin.i32_shrS(compileNode(node.args[0]), compileNode(node.args[1]));
        case '==': return thin.i32_eq(compileNode(node.args[0]), compileNode(node.args[1]));
        case '!=': return thin.i32_ne(compileNode(node.args[0]), compileNode(node.args[1]));
        case '<=': return thin.i32_le(compileNode(node.args[0]), compileNode(node.args[1]));
        case '>=': return thin.i32_ge(compileNode(node.args[0]), compileNode(node.args[1]));
        case '<': return thin.i32_lt(compileNode(node.args[0]), compileNode(node.args[1]));
        case '>': return thin.i32_gt(compileNode(node.args[0]), compileNode(node.args[1]));
        case '&&': return thin.i32_select(compileNode(node.args[0]), compileNode(node.args[1]), thin.i32_const(0));
        case '||': return thin.i32_select(compileNode(node.args[0]), thin.i32_const(1), compileNode(node.args[1]));
        case 'if': return thin.flow_if(compileNode(node.args[0]), compileNode(node.args[1]), node.args.length === 3 ? compileNode(node.args[2]) : thin.void_const());
        case 'select': return thin.i32_select(compileNode(node.args[0]), compileNode(node.args[1]), compileNode(node.args[2]));
        case 'block': return thin.flow_block(node.args.map(compileNode));
        case 'while': return thin.flow_loop(compileNode(node.args[0]), compileNode(node.args[1]));
        case 'return': return thin.flow_return(compileNode(node.args[0]));
        case 'def': throw new Error('Nested functions are not supported');
        case '[]': return thin.i32_load8U(computeAddress(node), 0);
        case '.': return thin.i32_load(computeAddress(node), 0);

        case '=': {
          const [left, right] = node.args;
          if (left.op === '[]') return thin.i32_store8(computeAddress(left), 0, compileNode(right));
          if (left.op === '.') return thin.i32_store(computeAddress(left), 0, compileNode(right));
          if (left.op !== 'name') throw new Error(`Invalid assignment target: ${left.op}`);
          if (left.value in variableMap) return thin.i32_store(thin.i32_const(variableMap[left.value]), 0, compileNode(right));
          if (left.value in functionMap) throw new Error(`Cannot indirectly reference function: ${left.value}`);
          if (left.value in argMap) return thin.i32_storeLocal(argMap[left.value], compileNode(right));
          return thin.i32_storeLocal(fn.argTypes.length + allocateLocal(left.value), compileNode(right));
        }

        case 'name': {
          if (node.value in variableMap) return thin.i32_load(thin.i32_const(variableMap[node.value]), 0);
          if (node.value in functionMap) throw new Error(`Cannot indirectly reference function: ${node.value}`);
          if (node.value in argMap) return thin.i32_loadLocal(argMap[node.value]);
          return thin.i32_loadLocal(fn.argTypes.length + allocateLocal(node.value));
        }

        case 'call': {
          const [target, ...args] = node.args;
          if (target.op !== 'name') throw new Error(`Invalid call target: ${target.op}`);
          if (target.value in functionMap) {
            const targetFn = functionMap[target.value];
            if (targetFn.argTypes.length !== args.length) throw new Error(`The function ${JSON.stringify(target.value)} takes ${targetFn.argTypes.length} arguments`);
            switch (targetFn.returnType) {
              case thin.Type.Void: return thin.i32_call(targetFn.id, args.map(compileNode));
              case thin.Type.I32: return thin.i32_call(targetFn.id, args.map(compileNode));
            }
          } else {
            let targetFn = importMap[target.value];
            if (!targetFn) {
              targetFn = {
                location: 'global',
                name: target.value,
                id: ++nextImportID,
                argTypes: args.map(() => thin.Type.I32),
                returnType: thin.Type.I32,
              };
              imports.push(targetFn);
              importMap[target.value] = targetFn;
            }
            if (targetFn.argTypes.length !== args.length) throw new Error(`The function ${JSON.stringify(target.value)} takes ${targetFn.argTypes.length} arguments`);
            switch (targetFn.returnType) {
              case thin.Type.Void: return thin.i32_callImport(targetFn.id, args.map(compileNode));
              case thin.Type.I32: return thin.i32_callImport(targetFn.id, args.map(compileNode));
            }
          }
          throw new Error('Invalid call');
        }
      }
    }
  }

  for (const global of ast) {
    if (global.op === '=') compileGlobalVariable(global);
    else if (global.op === 'def') compileGlobalFunction(global);
    else throw new Error(`Invalid global node: ${global.op}`);
  }

  for (const callback of secondPass) callback();
  const data = new Uint8Array(memorySize);
  data.set(new Uint8Array(new Int32Array(variables).buffer));
  return {data, imports, functions};
}

function main(): void {
  let source = '';
  process.stdin.on('data', chunk => source += chunk);
  process.stdin.on('end', () => {
    const ast = parse(source);
    const module = compile(ast, {memorySize: 128 * 1024});
    const compiled = thin.compileToJS(module);
    const code = `var code = ${new Buffer(compiled).toString()};
var stdin = '';
var i = 0;
var env = code({
  global: {
    read: function() { return stdin.charCodeAt(i++); },
    write: function(address) { process.stdout.write(pointerToString(address)); },
  },
});

function pointerToString(address) {
  var stdin = '';
  while (env.u8[address]) stdin += String.fromCharCode(env.u8[address++]);
  return stdin;
}

process.stdin.on('data', function(chunk) { stdin += chunk; });
process.stdin.on('end', function() { env.main(); });`;
    console.log(code);
  });
}

main();
