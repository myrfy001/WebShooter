import {selectElementByTreeLevelSelectRule} from './tree_level_selector'

function addHighlightStyle (nodes) {
  nodes.forEach(element => {
    element.classList.add('-webshooter-injected-style-highlight')
  })
}

export function removeHighlightStyle () {
  let selected = document.getElementsByClassName('-webshooter-injected-style-highlight')
  while (selected.length > 0) {
    selected[0].classList.remove('-webshooter-injected-style-highlight')
  }
}

export function highlightByLevelRule (groupRule, entries) {
  let selectedNodes = selectElementByTreeLevelSelectRule(groupRule, entries)
  addHighlightStyle(selectedNodes)
}

export function generateHighlightGroupRuleFromTreeData (node, child) {
  // Go from the leaf node to the root node, and get include, exclude, xpath information
  let includes = []
  let excludes = []
  const parentData = node.parent.data.children || node.parent.data

  if (child.length === 0) {
    includes.push(node.data.xpath)
  } else {
    for (const row of parentData) {
      if (row.fieldtype === 'f_include') {
        includes.push(row.xpath)
      } else if (row.fieldtype === 'f_exclude') {
        excludes.push(row.xpath)
      }
    }
  }

  let result = {
    includes,
    excludes,
    children: child
  }

  if (node.parent.parent !== null) {
    result = generateHighlightGroupRuleFromTreeData(node.parent, [result])
  }
  return result
}
