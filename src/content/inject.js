import Vue from 'vue'
import {generateRelXpath} from '../ext/xpath.js'
import {highlightByLevelRule, removeHighlightStyle} from '../ext/highlight.js'
import {selectElementByTreeLevelSelectRule} from '../ext/tree_level_selector.js'
import { Base64 } from 'js-base64'

Vue.config.productionTip = false

var style = document.createElement('style')
style.innerHTML = '.-webshooter-injected-style-highlight{outline:2px solid red!important;background-color:#ff00007a;}'
document.body.appendChild(style)

window._generateRelXpath = function (element, relativeRootInfo) {
  relativeRootInfo = JSON.parse(Base64.decode(relativeRootInfo))
  console.log(relativeRootInfo)
  let selectedNodes = selectElementByTreeLevelSelectRule(relativeRootInfo, [])
  console.log(selectedNodes)
  let xpath = generateRelXpath(element, selectedNodes)
  console.log(xpath)
  return xpath
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.name === 'highlight_node') {
    console.log(message.rules)
    removeHighlightStyle()
    highlightByLevelRule(message.rules, [])
  }
})
