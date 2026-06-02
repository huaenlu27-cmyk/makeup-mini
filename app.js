let _theme = {}

App({
  onLaunch() {
    console.log('[miniapp] onLaunch start')
    // defer heavy requires to avoid blocking startup
    setTimeout(()=>{
      try{
        console.log('[miniapp] loading data files')
        require('./data/products.json')
        require('./data/color_table.json')
        require('./data/taxonomy.json')
        console.log('[miniapp] data files loaded')
      }catch(e){
        console.warn('[miniapp] data require failed', e)
      }

      try{
        const theme = require('./theme')
        // set into globalData if available
        const app = getApp && getApp()
        if(app && app.globalData) {
          app.globalData.theme = theme
          console.log('[miniapp] theme set into globalData')
        } else {
          _theme = theme || {}
          console.log('[miniapp] theme fallback set')
        }
      }catch(e){ console.warn('[miniapp] theme require failed', e) }

      console.log('[miniapp] deferred init complete')
    }, 0)
  },
  globalData: {
    theme: _theme
  }
})

// Ensure JSON data is bundled by the build: require them from app root
try{
  require('./data/products.json')
  require('./data/color_table.json')
  require('./data/taxonomy.json')
}catch(e){
  // ignore in environments that don't support require for JSON
}

// load theme into globalData for pages to use
try{
  const theme = require('./theme')
  // set theme into existing globalData
  _theme = theme || {}
}catch(e){ }
