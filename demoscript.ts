import * as thin from './thin-ir';

type Op = 'def' | 'block' | 'if' | 'while' | 'return' | 'call' | 'select' | '=' | '||' | '&&' | '|' | '&' |
  '^' | '==' | '!=' | '<' | '>' | '<=' | '>=' | '<<' | '>>' | '+' | '-' | '*' | '/' | '%' | '.' | '[]';
type AST = {value: number} | {name: string} | {op: Op, args: AST[]}

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

    if (eat(/^'.'$/)) return {value: tokens[i - 1].charCodeAt(1)};
    if (eat(/^[0-9]+$/)) return {value: parseInt(tokens[i - 1], 10)};
    if (eat(/^[A-Za-z_][A-Za-z0-9_]*$/)) return {name: tokens[i - 1]};
    throw new Error(`Unexpected ${JSON.stringify(tokens[i])}`);
  }

  function binary(node: AST, level: number, op: Op, opLevel: number): AST {
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

    if (eat('[')) {
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

function compile(ast: AST[]): thin.Module {
  const data = new Uint8Array(0);
  const imports: thin.Import[] = [];
  const functions: thin.Function[] = [];
  return {data, imports, functions};
}

function main(): void {
  let source = '';
  process.stdin.on('data', chunk => source += chunk);
  process.stdin.on('end', () => {
    const ast = parse(source);
    const module = compile(ast);
  });
}

main();
