chrome.devtools.panels.elements.createSidebarPane(
  'Web Shooter',
  function (sidebar) {
    function updateElementProperties () {
      sidebar.setPage('pages/panel.html')
    }
    updateElementProperties()
  })
