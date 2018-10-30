// The following code comes from https://github.com/junejan143/ChroPath

export function generateAbsXpath (element) {
  if (!element) {
    return 'element is inside iframe & it is not supported by ChroPath currently. Please write xpath manually.'
  }
  if (element.tagName.toLowerCase() === 'html') {
    return '/html[1]'
  }
  if (element.tagName.toLowerCase() === 'body') {
    return '/html[1]/body[1]'
  }

  var ix = 0
  var siblings = element.parentNode.childNodes
  for (var i = 0; i < siblings.length; i++) {
    var sibling = siblings[i]
    if (sibling === element) {
      let absXpath
      if (element.tagName.toLowerCase().includes('svg')) {
        absXpath = generateAbsXpath(element.parentNode) + '/' + '*'
        return absXpath
      } else {
        absXpath = generateAbsXpath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']'
        if (absXpath.includes('/*/')) {
          absXpath = 'It might be child of iframe & it is not supported currently.'
        }
        return absXpath
      }
    }
    if (sibling.nodeType === 1 && sibling.tagName.toLowerCase() === element.tagName.toLowerCase()) {
      ix++
    }
  }
}
