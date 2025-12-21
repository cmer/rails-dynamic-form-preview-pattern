import { Controller } from "@hotwired/stimulus"

/**
 * Stimulus controller for live form preview functionality.
 * Works with `FormPreviewHelper` on the server side.
 *
 * Documentation: https://github.com/cmer/rails-dynamic-form-preview-pattern/blob/main/README.md
 * LLM Guide:     https://github.com/cmer/rails-dynamic-form-preview-pattern/blob/main/LLM.md
 *
 * @example
 *   <form data-controller="form-preview" data-form-preview-debounce-value="0"
 *         data-form-preview-url-value="/posts/1/preview" data-form-preview-http-method-value="get">
 *     <%= form_preview_hidden_field %>
 *     <input data-action="blur->form-preview#preview">
 *     <textarea data-action="input->form-preview#preview" data-form-preview-debounce-value="300">
 *   </form>
 */
export default class extends Controller {
  static values = {
    debounce: { type: Number, default: 0 },
    url: String,
    httpMethod: String
  }

  /**
   * Triggers a debounced form preview submission.
   * Uses element's data-form-preview-debounce-value if set, otherwise controller's value.
   */
  preview() {
    clearTimeout(this.debounceTimer)
    const customDebounce = event?.target?.dataset?.formPreviewDebounceValue
    const debounceValue = customDebounce ? Number(customDebounce) : this.debounceValue
    this.debounceTimer = setTimeout(() => this.#submitPreview(), debounceValue)
  }

  /** @private */
  #submitPreview() {
    const form = this.element.closest("form")

    const formPreviewInput = document.createElement("input")
    formPreviewInput.type = "hidden"
    formPreviewInput.name = "form_preview"
    formPreviewInput.value = true
    form.appendChild(formPreviewInput)

    // Store original form attributes
    const originalAction = form.action
    const originalMethod = form.method
    const hadNoValidate = form.noValidate

    // Temporarily remove Rails _method field if overriding HTTP method
    const methodField = form.querySelector('input[name="_method"]')
    if (this.hasHttpMethodValue && methodField) {
      methodField.remove()
    }

    // Override URL and method if values are set
    if (this.hasUrlValue) {
      form.action = this.urlValue
    }
    if (this.hasHttpMethodValue) {
      const method = this.httpMethodValue.toLowerCase()
      if (method !== "get" && method !== "post") {
        console.error(`form-preview: httpMethod must be "get" or "post", got "${this.httpMethodValue}"`)
      } else {
        form.method = method
      }
    }

    form.noValidate = true
    form.requestSubmit()

    // Defer restoration to next tick so Turbo can capture the modified form state
    setTimeout(() => {
      form.action = originalAction
      form.method = originalMethod
      form.noValidate = hadNoValidate

      // Restore Rails _method field if it was removed
      if (methodField) {
        form.appendChild(methodField)
      }

      formPreviewInput.remove()
    }, 0)
  }

  disconnect() {
    clearTimeout(this.debounceTimer)
  }
}
