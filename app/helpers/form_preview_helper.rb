# Helper module for live form preview functionality using Turbo Streams.
# Works with `form_preview_controller.js` Stimulus controller.
#
# Documentation: https://github.com/cmer/rails-dynamic-form-preview-pattern/blob/main/README.md
# LLM Guide:     https://github.com/cmer/rails-dynamic-form-preview-pattern/blob/main/LLM.md
module FormPreviewHelper
  # Handles form preview requests by rendering a Turbo Stream morph response.
  # Returns true if preview was rendered, nil if normal form submission.
  #
  # @param model [ActiveRecord::Base] The model instance to preview
  # @option args [String] :id DOM ID of form to replace (default: "#{model_name}-form")
  # @option args [String] :partial Partial to render (default: "form")
  # @option args [Hash] :locals Local variables for partial (default: { model_name: model })
  # @return [Boolean, nil]
  def render_form_preview(model, **args)
    if !form_preview?
      @form_was_user_submitted = true
      return
    end

    model.validate if form_preview_validate?

    locals = args[:locals] || { model.model_name.singular.to_sym => model }
    id = args[:id] || form_preview_form_id(model)

    render turbo_stream: turbo_stream.replace(
      id,
      partial: args[:partial] || "form",
      locals: locals,
      method: :morph
    )

    true
  end

  # Renders hidden field tracking user submission state. Required in forms.
  # @return [ActiveSupport::SafeBuffer]
  def form_preview_hidden_field
    hidden_field_tag :_wus, params[:_wus].presence || @form_was_user_submitted
  end

  # @return [Boolean] True if this is a preview request
  def form_preview?
    params[:form_preview].present?
  end

  # @return [Boolean] True if validation should run (user has submitted before)
  def form_preview_validate?
    params[:_wus].present?
  end

  # Generates form ID based on model name (e.g., "post-form").
  # @param model [ActiveRecord::Base]
  # @return [String]
  def form_preview_form_id(model)
    "#{model.model_name.singular}-form"
  end
end
