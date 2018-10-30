function getElementsByXpath (xpath, entryNode, excludeParents) {
  let nodesSnapshot = document.evaluate(xpath, entryNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  let result = []
  for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
    let node = nodesSnapshot.snapshotItem(i)
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

export function highlightByXpath (includes, excludes, children, entries) {
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
    console.log(selectedNodes)
    addHighlightStyle(selectedNodes)
  }
}
