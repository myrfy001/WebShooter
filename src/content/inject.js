import Vue from 'vue'
import {generateAbsXpath} from '../ext/xpath.js'
import {highlightByXpath} from '../ext/highlight.js'

Vue.config.productionTip = false

var style = document.createElement('style')
style.innerHTML = '.-webshooter-injected-style-highlight{outline:2px solid red!important;background-color:#ff00007a;}'
document.body.appendChild(style)

window.generateAbsXpath = generateAbsXpath
window.highlightByXpath = highlightByXpath
console.log(window)
