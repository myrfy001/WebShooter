// function moveToNextNonGroupParent (node) {
//   const oldNode = node
//   while (node.parent !== null) {
//     const nodeData = node.data
//     if (nodeData.fieldtype === 'f_group') {
//       node = node.parent
//       console.log('skip group')
//       continue
//     } else {
//       break
//     }
//   }
//   if (node.parent === null) {
//     return oldNode
//   } else {
//     return node
//   }
// }

// export function generateTreeLevelSelectRuleFromTreeData (node, child) {
//   // Go from the leaf node to the root node, and get include, exclude, xpath information
//   let includes = []
//   let excludes = []
//   let skipThisRow = false
//   if (child.length === 0) {
//     if (node.data.fieldtype !== 'f_group') {
//       console.log('--push-leaf', node)
//       includes.push(node.data.xpath)
//     } else {
//       console.log('--set-skip', node)
//       skipThisRow = true
//     }
//   } else {
//     console.log('--enter--node', node)
//     let parent = moveToNextNonGroupParent(node)
//     console.log('parent', parent)
//     const parentData = parent.data.children || parent.data
//     for (const row of parentData) {
//       if (row.fieldtype === 'f_include') {
//         console.log('--push-inc', node)
//         includes.push(row.xpath)
//       } else if (row.fieldtype === 'f_exclude') {
//         console.log('--push-exc', node)
//         excludes.push(row.xpath)
//       }
//     }
//   }

//   let result = {
//     includes,
//     excludes,
//     children: child
//   }

//   if (node.parent.parent !== null) {
//     if (skipThisRow) {
//       result = generateTreeLevelSelectRuleFromTreeData(node.parent, child)
//     } else {
//       result = generateTreeLevelSelectRuleFromTreeData(node.parent, [result])
//     }
//   }
//   console.log('--leave--node', node)
//   return result
// }

function moveToParentGroup (node) {
  const oldNode = node
  if (node.data.fieldtype === 'f_group') {
    // if input is a group, we wang the parent group, not this one
    node = node.parent
  }
  while (node.parent !== null) {
    const nodeData = node.data
    if (nodeData.fieldtype !== 'f_group') {
      node = node.parent
      continue
    } else {
      break
    }
  }
  if (node.parent === null) {
    return oldNode
  } else {
    return node
  }
}

export function generateTreeLevelSelectRuleFromTreeData (node, child) {
  // Go from the leaf node to the root node, and get include, exclude, xpath information
  let includes = []
  let excludes = []

  console.log('--enter--node', node)
  const parentGroup = moveToParentGroup(node)
  console.log('parentGroup', parentGroup)

  if (parentGroup === node) {
    // has reached the root
    console.log('reached the root', child)
    return child
  }

  const parentData = parentGroup.data.children || parentGroup.data
  for (const row of parentData) {
    if (row.fieldtype === 'f_include') {
      console.log('--push-inc', node)
      includes.push(row.xpath)
    } else if (row.fieldtype === 'f_exclude') {
      console.log('--push-exc', node)
      excludes.push(row.xpath)
    }
  }
  let result = {
    includes,
    excludes,
    children: child
  }

  result = generateTreeLevelSelectRuleFromTreeData(parentGroup, [result])
  console.log('--leave--node', node)
  return result
}

export function selectElementByTreeLevelSelectRule (groupRule, entries) {
  console.log('selectElementByTreeLevelSelectRule')
  console.log('groupRule', groupRule)
  let includes = groupRule.includes
  let excludes = groupRule.excludes
  let children = groupRule.children

  if (entries.length === 0) {
    entries = [document]
  }
  let selectedNodes = []
  console.log('entries', entries)
  debugger
  for (let entryNode of entries) {
    let excludedNodes = []
    console.log('excludes', excludes)
    for (let xpath of excludes) {
      console.log('xpath', xpath)
      let exclude = getElementsByXpath(xpath, entryNode, [])
      excludedNodes.push(...exclude)
    }
    console.log('excludedNodes', excludedNodes)
    for (let xpath of includes) {
      let include = getElementsByXpath(xpath, entryNode, excludedNodes)
      selectedNodes.push(...include)
    }
  }
  console.log('selectedNodes', selectedNodes)
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

function getElementsByXpath (xpath, entryNode, excludeParents, switchTextNode) {
  if (switchTextNode === undefined) {
    switchTextNode = true
  }
  let nodesSnapshot
  try {
    nodesSnapshot = document.evaluate(xpath, entryNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    console.log('xpath--', xpath)
  } catch (error) {
    return []
  }
  let result = []
  for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
    let node = nodesSnapshot.snapshotItem(i)
    let node_ = node
    if (switchTextNode && (node.nodeType === 2 || node.nodeType === 3)) {
      node = node.parentElement
      node_ = node
    }
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
      result.push(node_)
    }
  }
  return result
}
