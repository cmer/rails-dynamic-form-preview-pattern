# Rails Dynamic Form Preview Pattern

A pattern for live form updates in Rails applications using Turbo Streams and Stimulus. This repository serves as both a **demo application** and the **source code** for the pattern.

> **🤖 LLM Users:** See [LLM.md](https://github.com/cmer/rails-dynamic-form-preview-pattern/blob/main/LLM.md) for a token-efficient implementation guide.

## What is the Dynamic Form Preview Pattern?

The Dynamic Form Pattern enables real-time form updates without full page reloads. As users interact with form fields, the form is submitted in the background and morphed in-place using Turbo Streams. This allows for:

- **Live previews** — Show rendered content (e.g., Markdown) as the user types
- **Dynamic field updates** — Update dependent fields, calculations, or UI based on input
- **Conditional validation** — Display validation errors only after the user has attempted to submit
- **Enhanced UX** — Provide immediate feedback without page refreshes

## Running the Demo

To run this demo application locally:

```bash
# Clone the repository
git clone https://github.com/cmer/rails-dynamic-form-preview-pattern.git
cd rails-dynamic-form-preview-pattern

# Install dependencies
bundle install

# Set up the database
bin/rails db:create db:migrate db:seed

# Start the server
bin/rails server
```

Visit `http://localhost:3000/posts` to see the form preview pattern in action. Try:

- Creating a new post and typing in the body field to see live Markdown preview
- Submitting an invalid form, then editing fields to see live validation updates
- Changing the publish date to see the formatted date update instantly

## How It Works

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Browser                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Form with data-controller="form-preview"                            │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ Hidden field: _wus (was user submitted)                     │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ Input field with data-action="blur->form-preview#preview"   │    │   │
│  │  └──────────────────────────┬──────────────────────────────────┘    │   │
│  └─────────────────────────────┼───────────────────────────────────────┘   │
│                                │                                           │
│                                │ 1. User triggers event (blur/input/change │
│                                ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Stimulus Controller                                                 │   │
│  │  - Debounces the request                                            │   │
│  │  - Adds form_preview=true param                                     │   │
│  │  - Submits form via Turbo                                           │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
└─────────────────────────────────┼──────────────────────────────────────────┘
                                  │
                                  │ 2. Form submitted with form_preview=true
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              Server                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Controller Action (create/update)                                   │   │
│  │                                                                     │   │
│  │   return if render_form_preview(@model)                             │   │
│  │          │                                                          │   │
│  │          ▼                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────┐   │   │
│  │   │ FormPreviewHelper                                           │   │   │
│  │   │  - Checks form_preview? param                               │   │   │
│  │   │  - Validates model (if _wus present)                        │   │   │
│  │   │  - Renders Turbo Stream morph response                      │   │   │
│  │   └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │
                                   │ 3. Turbo Stream response
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              Browser                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Turbo morphs the form in-place                                      │   │
│  │  - Updates preview content                                          │   │
│  │  - Shows validation errors (if applicable)                          │   │
│  │  - Preserves focus and scroll position                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Validation Behavior

The pattern includes smart validation handling:

- **Before first submission**: Preview updates occur but validation errors are hidden
- **After first submission**: Preview updates include validation errors

This is tracked via a hidden `_wus` (was user submitted) field that persists across preview requests.

## Installation

Copy these two files to your Rails application:

### 1. Ruby Helper

Copy `app/helpers/form_preview_helper.rb` to your application:

```bash
cp app/helpers/form_preview_helper.rb /path/to/your/app/helpers/
```

### 2. Stimulus Controller

Copy `app/javascript/controllers/form_preview_controller.js` to your application:

```bash
cp app/javascript/controllers/form_preview_controller.js /path/to/your/app/javascript/controllers/
```

If using import maps, register the controller in `app/javascript/controllers/index.js`:

```javascript
import FormPreviewController from "./form_preview_controller"
application.register("form-preview", FormPreviewController)
```

## Usage

### Simple Example

A basic form with live preview on blur:

**Controller:**

```ruby
class PostsController < ApplicationController
  include FormPreviewHelper  # <<- Add this

  def new
    @post = Post.new
  end

  def create
    @post = Post.new(post_params)
    return if render_form_preview(@post)  # <<- Add this

    if @post.save
      redirect_to @post, notice: "Post created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def post_params
    params.require(:post).permit(:title, :body)
  end
end
```

**Form partial (`app/views/posts/_form.html.erb`):**

```erb
<%= form_with model: post,
              id: form_preview_form_id(post),
              data: { controller: "form-preview" } do |f| %>  <!-- Add this -->

  <%= form_preview_hidden_field %>  <!-- Add this -->

  <div>
    <%= f.label :title %>
    <%= f.text_field :title, data: { action: "blur->form-preview#preview" } %>  <!-- Add action -->
    <% if post.errors[:title].any? %>
      <span class="error"><%= post.errors[:title].first %></span>
    <% end %>
  </div>

  <div>
    <%= f.label :body %>
    <%= f.text_area :body, data: { action: "blur->form-preview#preview" } %>  <!-- Add action -->
    <% if post.errors[:body].any? %>
      <span class="error"><%= post.errors[:body].first %></span>
    <% end %>
  </div>

  <%= f.submit %>
<% end %>
```

### Advanced Example

A form with live Markdown preview, per-field debounce, and multiple event types:

**Form partial:**

```erb
<%= form_with model: post,
              id: form_preview_form_id(post),
              data: {
                controller: "form-preview",
                form_preview_debounce_value: 0
              } do |f| %>

  <%= form_preview_hidden_field %>

  <%# Text field - preview on blur (no debounce needed) %>
  <div>
    <%= f.label :title %>
    <%= f.text_field :title,
                     "aria-invalid": post.errors[:title].any? || nil,
                     data: { action: "blur->form-preview#preview" } %>
    <% if post.errors[:title].any? %>
      <small class="error"><%= post.errors[:title].first %></small>
    <% end %>
  </div>

  <%# Textarea - preview on input with 300ms debounce for live typing preview %>
  <div>
    <%= f.label :body %>
    <%= f.text_area :body,
                    rows: 10,
                    "aria-invalid": post.errors[:body].any? || nil,
                    data: {
                      action: "input->form-preview#preview",
                      form_preview_debounce_value: 300
                    } %>
    <% if post.errors[:body].any? %>
      <small class="error"><%= post.errors[:body].first %></small>
    <% end %>
  </div>

  <%# Select - preview on change %>
  <div>
    <%= f.label :category %>
    <%= f.select :category,
                 %w[Technology Design Business],
                 { include_blank: "Select category" },
                 data: { action: "change->form-preview#preview" } %>
  </div>

  <%# Date field - preview on change %>
  <div>
    <%= f.label :publish_on %>
    <%= f.date_field :publish_on,
                     data: { action: "change->form-preview#preview" } %>
    <% if post.publish_on.present? %>
      <small>Scheduled for <%= post.publish_on.strftime("%B %d, %Y") %></small>
    <% end %>
  </div>

  <%# Live Markdown preview %>
  <article>
    <header>Preview</header>
    <div id="preview">
      <%= render_markdown(post.body) %>
    </div>
  </article>

  <%= f.submit %>
<% end %>
```

## API Reference

### FormPreviewHelper

#### `render_form_preview(model, **options)`

Handles form preview requests. Call this at the start of your create/update actions.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `:id` | String | `"#{model_name}-form"` | DOM ID of the form to replace |
| `:partial` | String | `"form"` | Partial to render |
| `:locals` | Hash | `{ model_name: model }` | Local variables for the partial |

**Returns:** `true` if preview was rendered, `nil` otherwise.

```ruby
# Basic usage
return if render_form_preview(@post)

# With custom options
return if render_form_preview(@post,
                               id: "inline-post-form",
                               partial: "posts/compact_form",
                               locals: { post: @post, show_preview: true })
```

#### `form_preview_hidden_field`

Renders the hidden field that tracks user submission state. **Required in every form.**

```erb
<%= form_preview_hidden_field %>
```

#### `form_preview_form_id(model)`

Generates a consistent form ID based on the model name.

```erb
<%= form_with model: post, id: form_preview_form_id(post) do |f| %>
<%# Generates id="post-form" %>
```

#### `form_preview?`

Returns `true` if the current request is a form preview request.

```ruby
if form_preview?
  # Handle preview-specific logic
end
```

#### `form_preview_validate?`

Returns `true` if validation should run (user has previously submitted the form).

### Stimulus Controller

#### Values

| Value | Type | Default | Description |
|-------|------|---------|-------------|
| `debounce` | Number | `0` | Default debounce in milliseconds |
| `url` | String | _(none)_ | Optional URL to submit preview requests to (overrides form action) |
| `httpMethod` | String | _(none)_ | Optional HTTP method for preview requests: `"get"` or `"post"` only |

Set at controller level:

```erb
<form data-controller="form-preview" data-form-preview-debounce-value="200">
```

Override per element:

```erb
<textarea data-action="input->form-preview#preview"
          data-form-preview-debounce-value="300">
```

#### Custom Preview Endpoint (Optional)

You can submit preview requests to a different URL and/or HTTP method than the form's default action. This is useful when you want to use a dedicated preview endpoint:

```erb
<%= form_with model: post,
              id: form_preview_form_id(post),
              data: {
                controller: "form-preview",
                form_preview_url_value: post_preview_path(post),
                form_preview_http_method_value: "get"
              } do |f| %>
```

When these values are set, preview submissions will use the specified URL/method while the form's normal submit behavior remains unchanged.

> **Note:** POST preview requests may cause password managers like 1Password to display "Save Identity" or "Save Password" dialogs on every preview request, which is disruptive. To avoid this, submit previews via GET to a dedicated endpoint.

#### Actions

| Action | Description |
|--------|-------------|
| `preview` | Triggers a debounced form preview submission |

### Recommended Events by Field Type

| Field Type | Event | Debounce | Rationale |
|------------|-------|----------|-----------|
| `text_field` | `blur` | 0ms | Preview when user leaves field |
| `text_area` | `input` | 200-500ms | Live preview while typing |
| `select` | `change` | 0ms | Immediate feedback on selection |
| `date_field` | `change` | 0ms | Immediate feedback on date pick |
| `check_box` | `change` | 0ms | Immediate feedback on toggle |
| `radio_button` | `change` | 0ms | Immediate feedback on selection |

## Requirements

- Rails 7.0+ with Turbo
- Stimulus 3.0+
- Turbo 8.0+ (for morphing support)

## License

MIT
