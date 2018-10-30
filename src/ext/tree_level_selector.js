export function generateTreeLevelSelectRuleFromTreeData (node, child) {
  // Go from the leaf node to the root node, and get include, exclude, xpath information
  let includes = []
  let excludes = []
  if (node.parent === null) {
    return {
      includes,
      excludes,
      children: child
    }
  }
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
    result = generateTreeLevelSelectRuleFromTreeData(node.parent, [result])
  }
  return result
}
export function selectElementByTreeLevelSelectRule (groupRule, entries) {
  const includes = groupRule.includes
  const excludes = groupRule.excludes
  const children = groupRule.children

  if (entries.length === 0) {
    entries = [document]
  }
  let selectedNodes = []

  for (let entryNode of entries) {
    let excludedNodes = []
    for (let xpath of excludes) {
      let exclude = getElementsByXpath(xpath, entryNode, [])
      excludedNodes.push(...exclude)
    }

    for (let xpath of includes) {
      let include = getElementsByXpath(xpath, entryNode, excludedNodes)
      selectedNodes.push(...include)
    }
  }

  if (children.length === 0) {
    return selectedNodes
  } else {
    let result = []
    for (const child of children) {
      let ret = selectElementByTreeLevelSelectRule(child, selectedNodes)
      result = result.concat(ret)
    }
    return result
  }
}

function getElementsByXpath (xpath, entryNode, excludeParents) {
  let nodesSnapshot
  try {
    nodesSnapshot = document.evaluate(xpath, entryNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  } catch (error) {
    return []
  }
  let result = []
  for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
    let node = nodesSnapshot.snapshotItem(i)
    // console.log(nodesSnapshot.snapshotItem(i).tagName)
    let canSelect = true
    for (let excludeNode of excludeParents) {
      while (node !== null) {
        if (node === excludeNode) {
          canSelect = false
          break
        }
        node = node.parentElement
      }
      if (!canSelect) {
        break
      }
    }
    if (canSelect) {
      result.push(nodesSnapshot.snapshotItem(i))
    }
  }
  return result
}
