<template>
<div class="custom-tree-container">
  <div>
    <el-switch
      v-model="javascript_enabled"
      active-text="Enable JS"
      inactive-text="Disable JS"
      @change="change_javascript_enable">
    </el-switch>
    <el-button @click="() => handleImport()">导入</el-button>
    <el-button @click="() => handleExport()" >导出</el-button>
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
        <el-select v-model="data.fieldtype" placeholder="请选择" :style="{width:'6em'}">
                <el-option label="(分组" value="f_group"></el-option>
                <el-option label="+包含" value="f_include"></el-option>
                <el-option label="-排除" value="f_exclude"></el-option>
                <el-option label="字符串" value="v_string"></el-option>
                <el-option label="整数" value="v_int"></el-option>
                <el-option label="浮点" value="v_float"></el-option>
                <el-option label="日期" value="v_date"></el-option>
        </el-select>
        <el-input placeholder="请输入字段名" v-model="data.fieldname" :style="{width:'20em'}"></el-input>
        <el-input placeholder="请输入Xpath" v-model="data.xpath" :disabled="data.fieldtype==='f_group'" @mousemove="() => handleHighlightHover(node, data)">
          <el-button slot="append" icon="el-icon-check" :disabled="data.fieldtype==='f_group'" @click="() => getSelectedNodeXpath(node, data)"></el-button>
        </el-input>
  
        <span>
          <el-button
            size="mini"
            icon="el-icon-circle-plus"
            circle
            style='margin:0px;'
            @click="() => append(node, data)">
          </el-button>
          <el-button
            size="mini"
            icon="el-icon-d-arrow-right"
            circle
            style='margin:0px;'
            @click="() => addChild(node, data)">
          </el-button>
          <el-button
            size="mini"
            icon="el-icon-remove"
            circle
            style='margin:0px;'
            @click="() => remove(node, data)">
          </el-button>
          <el-button
            size="mini"
            icon="el-icon-search"
            circle
            style='margin:0px;'
            @click="() => handleHighlightHover(node, data)">
          </el-button>
        </span>
      </span>
    </el-tree>
  </div>
  <el-dialog
  title="提示"
  :visible.sync="visibleImportExport"
  width="100%">
  <el-input
    type="textarea"
    :autosize="{ minRows: 5, maxRows: 20}"
    placeholder="请粘贴数据"
    v-model="importExportData">
  </el-input>
  <span slot="footer" class="dialog-footer">
    <el-button type="primary" @click="handleCloseImportExportBox">关闭</el-button>
  </span>
</el-dialog>
</div>
</template>

<script>
  import { generateExportData } from '../ext/import_export'
  import {generateTreeLevelSelectRuleFromTreeData} from '../ext/tree_level_selector'
  import { Base64 } from 'js-base64'
  const backgroundPageConnection = chrome.runtime.connect({
    name: 'web-shooter-comm-port'
  })

  function uuidv4 () {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  export default {
    data () {
      const mainData = [{
        id: 1,
        fieldname: 'root',
        xpath: '',
        fieldtype: 'f_group',
        children: []
      }]
      return {
        main_data: JSON.parse(JSON.stringify(mainData)),
        last_main_data: JSON.parse(JSON.stringify(mainData)),
        javascript_enabled: true,
        ready: false,
        importExportData: '',
        visibleImportExport: false,
        importExportType: 'import'

      }
    },
    watch: {
      main_data: {
        handler: function (new_, old_) {
          let err = this.validMainData(new_)
          if (err !== '') {
            this.$nextTick(() => { this.main_data = this.last_main_data })
            this.$alert(err, '错误')
          } else {
            this.last_main_data = JSON.parse(JSON.stringify(new_))
          }
        },
        deep: true
      }
    },
    created () {
      this.getJavascriptStatus()
      chrome.devtools.panels.elements.onSelectionChanged.addListener(
        this.handleDomSelectUpdate.bind(this))
      backgroundPageConnection.onMessage.addListener((message) => {
        console.log(message)
      })
      backgroundPageConnection.postMessage({
        name: 'init',
        tabId: chrome.devtools.inspectedWindow.tabId
      })
    },
    methods: {
      append (node, data) {
        const newChild = { id: uuidv4(), children: [] }
        const parentData = node.parent.data.children || node.parent.data
        parentData.push(newChild)
      },

      addChild (node, data) {
        const newChild = { id: uuidv4(), children: [] }
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
            console.log(tab.url)
            let tmp = tab.url.split('//')
            const schema = tmp[0]
            const netlocal = tmp[1].split('/')[0]
            let url = schema + '//' + netlocal + '/*'
            console.log(url)

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
      },

      getSelectedNodeXpath (node, data) {
        let relativeRootInfo = generateTreeLevelSelectRuleFromTreeData(node.parent, [])
        // if node is the top level node, relativeRootInfo is []
        if (relativeRootInfo.length === 0) {
          relativeRootInfo = [{
            includes: [],
            excludes: [],
            children: []
          }]
        }
        console.log('relativeRootInfo', relativeRootInfo)
        let b64 = Base64.encode(JSON.stringify(relativeRootInfo[0]))
        chrome.devtools.inspectedWindow.eval('_generateRelXpath($0,"' + b64 + '")', {useContentScriptContext: true}, (xpath) => {
          this.$set(data, 'xpath', xpath)
        })
      },

      handleHighlightHover (node, data) {
        let ret
        if (data.fieldtype === 'f_group') {
          ret = generateTreeLevelSelectRuleFromTreeData(node, [])
        } else if (data.fieldtype === 'f_include' || data.fieldtype === 'f_exclude') {
          ret = generateTreeLevelSelectRuleFromTreeData(node, [])
        } else {
          ret = generateTreeLevelSelectRuleFromTreeData(
            node,
            [{
              includes: [data.xpath],
              excludes: [],
              children: []
            }])
        }
        ret = ret[0]
        console.log(ret)
        backgroundPageConnection.postMessage({
          tabId: chrome.devtools.inspectedWindow.tabId,
          name: 'highlight_node',
          rules: ret
        })
      },

      handleImport () {
        this.importExportType = 'import'
        this.importExportData = ''
        this.visibleImportExport = true
      },

      handleExport () {
        this.importExportType = 'export'
        const ret = generateExportData(this.main_data)
        this.importExportData = JSON.stringify(ret)
        this.visibleImportExport = true
      },

      handleCloseImportExportBox () {
        if (this.importExportType === 'import') {
          const data = JSON.parse(this.importExportData)
          this.main_data = data.main_data
        }
        this.visibleImportExport = false
      },

      validMainData (data) {
        let err = ''
        for (let row of data) {
          if (row.children.length !== 0) {
            if (row.fieldtype !== 'f_group') {
              err = '只有分组才可以有子节点'
              break
            }
            err = this.validMainData(row.children)
          }
        }
        return err
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

  .el-input {
    pointer-events: auto
  }



</style>