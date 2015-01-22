var SBB = $.inherit({
    __constructor : function() { // constructor
    },

    getUrlVars: function(){
      var vars = [], hash;
      var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
      for(var i = 0; i < hashes.length; i++)
      {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
      }
      return vars;
    },

    getUrlVar: function(name){
      return this.getUrlVars()[name];
    },

    getURIParameter: function(param, asArray) {
      return document.location.search.substring(1).split('&').reduce(function(p,c) {
        var parts = c.split('=', 2).map(function(param) { return decodeURIComponent(param); });
        if(parts.length == 0 || parts[0] != param) return (p instanceof Array) && !asArray ? null : p;
        return asArray ? p.concat(parts.concat(true)[1]) : parts.concat(true)[1];
      }, []);
    },

    initResizeGrid: function() {
      $(window).resize(function(){
        $('.grid-products').find('.grid-image').each(function(index) {
          $(this).css({'height': (($(this).closest('.grid-element').width()))+'px'});
        });
        $('.grid-sections').find('.grid-image').each(function(index) {
          $(this).css({'height': (($(this).closest('.grid-element').width()))+'px'});

          $(this).find('.grid-overfly-txt').each(function(index) {
            $(this).css({'top': (($(this).parent().height()/2)-($(this).height()/2))+'px'});
          });

        });
      }).trigger('resize')
    },

    initHandlebars: function() {
      Handlebars.registerHelper("currency", function(str, args) {
        return str?'$' + str.toFixed(2):'$0.00';
      });

      if($("#temp-product")) Handlebars.registerPartial("product", $("#temp-product").html());
    },

    initBootstrap: function() {
      $('[rel="tooltip"]').tooltip();
      $('[rel="popover"]').popover({html: true});
    },

    initLinkBind: function() {
      $('a.bind').click(function(e){ e.preventDefault(); });
      $('form.bind').submit(function(e){ e.preventDefault(); });
    },

    init: function() {
      this.initHandlebars();
      this.initBootstrap();
      this.initResizeGrid();
      this.initLinkBind();
    }
});

var SBBProduct = $.inherit(SBB, {
    __constructor : function(property) {
      this.init();
    },

    getList : function(options, cb) {
      if(!options) options = {};
      var api = new $.RestClient('/api/');
          api.add('products');

      var request = api.products.read(options);
      request.done(function (data) {
        cb(data);
      })
    },

    search : function(options, cb) {
      if(!options) options = {};
      var api = new $.RestClient('/api/products/');
          api.add('search');

      var request = api.search.read(options);
      request.done(function (data) {
        cb(data);
      })
    }

});
