!function ($) {
  var r = require('promise')

  $.ender({
      join: r.join,
      chain: r.chain,
      ajax: r.ajax,
  })
}(ender);