import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve('src')
const files = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(filePath)
    } else if (entry.name.endsWith('.tsx')) {
      files.push(filePath)
    }
  }
}

function collectStrings(node, out) {
  if (!node) return
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    out.push(node.text)
    return
  }
  if (ts.isTemplateExpression(node)) {
    out.push(node.head.text)
    for (const span of node.templateSpans) out.push(span.literal.text)
    return
  }
  ts.forEachChild(node, (child) => collectStrings(child, out))
}

function classStrings(sourceFile) {
  const result = []
  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'className' &&
      node.initializer
    ) {
      if (ts.isStringLiteral(node.initializer)) {
        result.push({ text: node.initializer.text, line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 })
      } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        const strings = []
        collectStrings(node.initializer.expression, strings)
        result.push(...strings.map((text) => ({ text, line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 })))
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return result
}

const prefixes = new Set([
  'absolute', 'accent', 'align', 'animate', 'antialiased', 'aria', 'aspect', 'auto', 'backdrop',
  'basis', 'bg', 'block', 'blur', 'border', 'bottom', 'box', 'capitalize', 'clear', 'col',
  'content', 'cursor', 'decoration', 'disabled', 'divide', 'duration', 'ease', 'fill', 'fixed',
  'flex', 'focus', 'focus-visible', 'focus-within', 'font', 'from', 'gap', 'grid', 'group',
  'h', 'hidden', 'hover', 'inline', 'inset', 'isolate', 'items', 'justify', 'leading', 'left',
  'line', 'list', 'm', 'max', 'mb', 'md', 'min', 'ml', 'mr', 'mt', 'mx', 'my', 'object',
  'opacity', 'order', 'outline', 'overflow', 'p', 'pb', 'place', 'placeholder', 'pl',
  'pointer', 'pr', 'pt', 'px', 'py', 'relative', 'resize', 'right', 'ring', 'rotate',
  'rounded', 'row', 'scale', 'scroll', 'shadow', 'shrink', 'size', 'sm', 'space', 'sr',
  'static', 'sticky', 'stroke', 'table', 'text', 'to', 'top', 'tracking', 'transition',
  'translate', 'underline', 'uppercase', 'via', 'visible', 'w', 'whitespace', 'xl', 'z',
  'lg', '2xl',
])

function normalizeToken(token) {
  return token
    .replace(/^-/, '')
    .replace(/^(sm|md|lg|xl|2xl|hover|focus|focus-visible|focus-within|active|disabled|aria-\[[^\]]+\]|group-hover|before|after):/, '')
}

walk(root)

const suspicious = []
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  for (const item of classStrings(sourceFile)) {
    for (const rawToken of item.text.split(/\s+/).filter(Boolean)) {
      const token = normalizeToken(rawToken)
      if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+/.test(token)) continue
      const prefix = token.split('-')[0]
      if (!prefixes.has(prefix)) {
        suspicious.push(`${path.relative(process.cwd(), file)}:${item.line} ${rawToken}`)
      }
    }
  }
}

console.log(suspicious.join('\n'))
