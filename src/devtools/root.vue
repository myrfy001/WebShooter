<template>
<div class="custom-tree-container">
  <div>
    <el-switch
      v-model="javascript_enabled"
      active-text="Enable JS"
      inactive-text="Disable JS"
      @change="change_javascript_enable">
    </el-switch>
  </div>
  <div class="block">
    <el-tree
      :data="main_data"
      node-key="id"
      default-expand-all
      draggable
      :expand-on-click-node="false"
      :allow-drop="check_tree_allow_drop">
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <el-select v-model="data.fieldtype" placeholder="请选择" :style="{width:'10%'}">
                <el-option label="-分组" value="f_group"></el-option>
                <el-option label="字符串" value="v_string"></el-option>
                <el-option label="整数" value="v_int"></el-option>
                <el-option label="浮点" value="v_float"></el-option>
                <el-option label="日期" value="v_date"></el-option>
        </el-select>
        <el-input placeholder="请输入字段名" v-model="data.fieldname" :style="{width:'15%'}"></el-input>
        <el-input placeholder="请输入Xpath" v-model="data.xpath" :style="{width:'75%'}">
          <el-button slot="append" icon="el-icon-search" @click="() => enterXpathSelectMode(data)"></el-button>
        </el-input>
        

        <span>
          <el-button
            type="text"
            size="mini"
            @click="() => append(node, data)">
            Append
          </el-button>
          <el-button
            type="text"
            size="mini"
            @click="() => remove(node, data)">
            Delete
          </el-button>
          <el-button
            type="text"
            size="mini"
            @click="() => handleHighlightSelected(node, data)">
            View
          </el-button>
        </span>
      </span>
    </el-tree>
  </div>
</div>
</template>

<script>
  // import getXpath from '../ext/xpath.js'
  let id = 1000
  const backgroundPageConnection = chrome.runtime.connect({
    name: 'web-shooter-comm-port'
  })

  export default {
    data () {
      const mainData = [{
        id: 1,
        fieldname: 'root',
        xpath: '',
        fieldtype: 'f_group'
      }]
      return {
        main_data: JSON.parse(JSON.stringify(mainData)),
        javascript_enabled: true,
        ready: false,
        current_modifying_tree_node: null
      }
    },
    created () {
      this.getJavascriptStatus()
      chrome.devtools.panels.elements.onSelectionChanged.addListener(
        this.handleDomSelectUpdate.bind(this))
      backgroundPageConnection.onMessage.addListener((message) => {
        console.log('qqq')
        console.log(message)
      })
      backgroundPageConnection.postMessage({
        name: 'init',
        tabId: chrome.devtools.inspectedWindow.tabId
      })
    },
    methods: {
      append (node, data) {
        const newChild = { id: id++, label: 'testtest', children: [] }
        if (!data.children) {
          this.$set(data, 'children', [])
        }
        data.children.push(newChild)
      },

      remove (node, data) {
        const parent = node.parent
        if (node.level === 1) {
          return
        }
        const children = parent.data.children || parent.data
        const index = children.findIndex(d => d.id === data.id)
        children.splice(index, 1)
      },

      check_tree_allow_drop (draggingNode, dropNode, type) {
        // Only allow a single root, can't have two first level element
        if (dropNode.level === 1 && type !== 'inner') {
          return false
        } else {
          return true
        }
      },

      change_javascript_enable () {
        chrome.tabs.get(chrome.devtools.inspectedWindow.tabId,
          (tab) => {
            let url = tab.url.split('?')[0].split('#')[0]
            url = url + (url[url.length - 1] === '/' ? '*' : '/*')

            if (!this.ready) {
              console.log('not ready')
              return
            }
            const state = this.javascript_enabled ? 'allow' : 'block'
            chrome.contentSettings.javascript.set({primaryPattern: url, setting: state}, () => {
              chrome.tabs.reload(tab.id)
            })
          })
      },

      getJavascriptStatus () {
        chrome.tabs.get(chrome.devtools.inspectedWindow.tabId,
          (tabs) => {
            let url = tabs.url.split('?')[0].split('#')[0] + '/*'
            url = url + (url[url.length - 1] === '/' ? '*' : '/*')
            chrome.contentSettings.javascript.get({primaryUrl: url}, (details) => {
              this.javascript_enabled = details.setting === 'allow'
              this.ready = true
            })
          })
      },

      handleDomSelectUpdate () {
        console.log('handleDomSelectUpdate')
        chrome.devtools.inspectedWindow.eval('generateAbsXpath($0)', {useContentScriptContext: true}, (xpath) => {
          if (this.current_modifying_tree_node) {
            this.current_modifying_tree_node.xpath = xpath
            this.current_modifying_tree_node = null
          }
        })
      },

      enterXpathSelectMode (data) {
        this.current_modifying_tree_node = data
      },

      handleHighlightSelected (node, data) {
        console.log('123123')
        chrome.devtools.inspectedWindow.eval('highlightByXpath(["/html[1]/body[1]/div[2]/form[1]/div[1]"], [], [], [], [])', {useContentScriptContext: true}, (result) => {
          console.log(result)
        })
      }
    }
  }
</script>

<style>
  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 28px;
    padding-right: 8px;
  }

  .el-tree-node__content{
    height:200%;
  } 



</style>