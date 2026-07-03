type SchemaNode = {
  id: string
  label: string
  sublabel?: string
  type: 'cause' | 'mechanism' | 'consequence' | 'complication'
}

type SchemaEdge = {
  from: string
  to: string
}

type Schema = {
  nodes: SchemaNode[]
  edges: SchemaEdge[]
}

const nodeColors = {
  cause:        { fill: '#FCEBEB', stroke: '#A32D2D', title: '#791F1F', sub: '#A32D2D' },
  mechanism:    { fill: '#E6F1FB', stroke: '#185FA5', title: '#0C447C', sub: '#185FA5' },
  consequence:  { fill: '#FAEEDA', stroke: '#BA7517', title: '#633806', sub: '#BA7517' },
  complication: { fill: '#EEEDFE', stroke: '#534AB7', title: '#3C3489', sub: '#534AB7' },
}

export default function SchemaViewer({ schema }: { schema: Schema }) {
  if (!schema?.nodes?.length) return null

  const byType = {
    cause:        schema.nodes.filter(n => n.type === 'cause'),
    mechanism:    schema.nodes.filter(n => n.type === 'mechanism'),
    consequence:  schema.nodes.filter(n => n.type === 'consequence'),
    complication: schema.nodes.filter(n => n.type === 'complication'),
  }

  const layers = (['cause', 'mechanism', 'consequence', 'complication'] as const)
    .filter(t => byType[t].length > 0)

  const W = 340
  const BOX_H = 52
  const BOX_GAP = 8
  const LAYER_GAP = 36
  const ARROW_H = 20
  const PAD = 16

  let svgHeight = PAD
  const layerMeta: { y: number; nodes: SchemaNode[]; type: string }[] = []

  layers.forEach((type, i) => {
    const nodes = byType[type]
    layerMeta.push({ y: svgHeight, nodes, type })
    svgHeight += BOX_H
    if (i < layers.length - 1) svgHeight += ARROW_H + LAYER_GAP
  })
  svgHeight += PAD

  const getBoxX = (index: number, total: number, boxW: number) => {
    const totalW = total * boxW + (total - 1) * BOX_GAP
    const startX = (W - totalW) / 2
    return startX + index * (boxW + BOX_GAP)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-4">
        Schéma physiopathologique
      </p>
      <svg
        viewBox={`0 0 ${W} ${svgHeight}`}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>

        {layerMeta.map((layer, li) => {
          const colors = nodeColors[layer.type as keyof typeof nodeColors]
          const n = layer.nodes.length
          const boxW = n === 1 ? W - 2 * PAD : n === 2 ? (W - 2 * PAD - BOX_GAP) / 2 : (W - 2 * PAD - 2 * BOX_GAP) / 3

          return (
            <g key={layer.type}>
              {layer.nodes.map((node, ni) => {
                const x = getBoxX(ni, n, boxW)
                const y = layer.y
                const cx = x + boxW / 2
                return (
                  <g key={node.id}>
                    <rect
                      x={x} y={y}
                      width={boxW} height={BOX_H}
                      rx="8"
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth="0.5"
                    />
                    <text
                      x={cx} y={node.sublabel ? y + 18 : y + BOX_H / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="11"
                      fontWeight="500"
                      fill={colors.title}
                      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                    >
                      {node.label}
                    </text>
                    {node.sublabel && (
                      <text
                        x={cx} y={y + 36}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="10"
                        fontWeight="400"
                        fill={colors.sub}
                        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                      >
                        {node.sublabel}
                      </text>
                    )}
                  </g>
                )
              })}

              {li < layerMeta.length - 1 && (
                <line
                  x1={W / 2}
                  y1={layer.y + BOX_H + 4}
                  x2={W / 2}
                  y2={layer.y + BOX_H + ARROW_H + LAYER_GAP - 4}
                  stroke="#9CA3AF"
                  strokeWidth="1"
                  markerEnd="url(#arr)"
                />
              )}
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-50">
        {layers.map(type => {
          const colors = nodeColors[type]
          const labels = { cause: 'Cause', mechanism: 'Mécanisme', consequence: 'Conséquence', complication: 'Complication' }
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: colors.fill, border: `1px solid ${colors.stroke}` }} />
              <span className="text-xs text-gray-400">{labels[type]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}