# Rails Dynamic Form Preview Pattern - LLM Implementation Guide

## What This Does

Live form updates in Rails without page reloads. Form submits in background on field events (blur/input/change), server returns Turbo Stream morph to update form in-place. Enables live previews, dynamic UI updates, and conditional validation (errors only show after first real submit attempt).

## Files to Copy

Download these two files into the target Rails app:

```bash
# Ruby helper
curl -o app/helpers/form_preview_helper.rb \
  https://raw.githubusercontent.com/cmer/rails-dynamic-form-preview-pattern/main/app/helpers/form_preview_helper.rb

# Stimulus controller
curl -o app/javascript/controllers/form_preview_controller.js \
  https://raw.githubusercontent.com/cmer/rails-dynamic-form-preview-pattern/main/app/javascript/controllers/form_preview_controller.js
```

## Implementation Steps

### 1. Controller

Include helper and add `render_form_preview` call:

```ruby
class ThingsController < ApplicationController
  include FormPreviewHelper

  def create
    @thing = Thing.new(thing_params)
    return if render_form_preview(@thing)
    # normal save logic...
  end

  def update
    @thing = Thing.find(params[:id])
    @thing.assign_attributes(thing_params)
    return if render_form_preview(@thing)
    # normal save logic...
  end
end
```

### 2. Form Partial

Required elements:
- `id: form_preview_form_id(model)` on form
- `data: { controller: "form-preview" }` on form
- `<%= form_preview_hidden_field %>` inside form
- `data: { action: "EVENT->form-preview#preview" }` on fields

```erb
<%= form_with model: thing, id: form_preview_form_id(thing), data: { controller: "form-preview" } do |f| %>
  <%= form_preview_hidden_field %>

  <%= f.text_field :name, data: { action: "blur->form-preview#preview" } %>
  <%= f.text_area :body, data: { action: "input->form-preview#preview", form_preview_debounce_value: 300 } %>
  <%= f.select :status, options, {}, data: { action: "change->form-preview#preview" } %>

  <%= f.submit %>
<% end %>
```

### 3. Events by Field Type

| Field | Event | Debounce |
|-------|-------|----------|
| text_field | blur | 0 |
| text_area | input | 200-500ms |
| select/date/checkbox/radio | change | 0 |

Set debounce on element: `data: { form_preview_debounce_value: 300 }`

## Options

`render_form_preview(model, **options)`:
- `:id` - DOM ID to replace (default: `"#{model_name}-form"`)
- `:partial` - partial to render (default: `"form"`)
- `:locals` - locals hash (default: `{ model_name: model }`)

## Requirements

Rails 7.0+, Turbo 8.0+ (morphing), Stimulus 3.0+

