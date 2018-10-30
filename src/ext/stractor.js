
export function generateStractorSelectorRule (levelDataIn, groupNmae) {
  let include = []
  let exclude = []
  let value = []
  let children = []
  for (const row of levelDataIn) {
    if (row.fieldtype === 'f_group') {
      children.push(generateStractorSelectorRule(row.children, row.fieldname))
    } else if (row.fieldtype === 'f_include') {
      include.push({
        type: 'xpath',
        name: row.fieldname,
        query: [row.xpath]
      })
    } else if (row.fieldtype === 'f_exclude') {
      exclude.push({
        type: 'xpath',
        name: row.fieldname,
        query: [row.xpath]
      })
    } else if (['v_string', 'v_int', 'v_float', 'v_date'].includes(row.fieldtype)) {
      value.push({
        type: 'xpath',
        name: row.fieldname,
        query: [row.xpath]
      })
    }
  }

  const result = {
    name: groupNmae,
    include,
    remove: exclude,
    value,
    children
  }

  return result
}
