// 依赖关系图（v1.4.0）：可折叠树形展示 package-lock.json 依赖关系
import { useState } from 'react'
import type { DepGraphNode } from '../../types'

interface DependencyGraphProps {
  graph: DepGraphNode
}

/** 树节点：可展开/折叠 */
function TreeNode({ node, depth }: { node: DepGraphNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children.length > 0

  return (
    <li>
      <div
        className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-700/40"
        style={{ paddingLeft: `${depth * 20 + 6}px` }}
      >
        {hasChildren && !node.duplicated ? (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? '折叠' : '展开'}
            className="rounded p-0.5 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg
              className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-4" aria-hidden="true" />
        )}
        <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-100">
          {node.name}
        </span>
        {node.version && (
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {node.version}
          </span>
        )}
        {node.spec && (
          <span className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            {node.spec}
          </span>
        )}
        {node.duplicated && (
          <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            循环/重复
          </span>
        )}
      </div>
      {hasChildren && !node.duplicated && open && (
        <ul className="border-l border-slate-200 dark:border-slate-700">
          {node.children.map((child) => (
            <TreeNode key={`${child.name}-${child.version}-${depth}`} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function DependencyGraph({ graph }: DependencyGraphProps) {
  const total = countNodes(graph)
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/40">
      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
        依赖树（共 {total} 个节点）· 来源 package-lock.json · 点击箭头展开/折叠
      </p>
      <ul className="max-h-96 overflow-auto rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
        <TreeNode node={graph} depth={0} />
      </ul>
    </div>
  )
}

function countNodes(node: DepGraphNode): number {
  return 1 + node.children.reduce((n, c) => n + countNodes(c), 0)
}
