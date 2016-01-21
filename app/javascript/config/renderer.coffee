do (Marionette) ->
  _.extend Marionette.Renderer,

    render: (template, data) ->
      return template(data) if typeof template is 'function'
      path = @getTemplate(template)
      throw "Template #{template} not found!" unless path
      path(data)

    getTemplate: (template) ->
      JST[template]