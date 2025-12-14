import { Controller } from "@hotwired/stimulus"

/**
 * Stimulus controller for live form preview functionality.
 * Works with `FormPreviewHelper` on the server side.
 *
 * Documentation: https://github.com/cmer/rails-dynamic-form-preview-pattern/blob/main/README.md
 * LLM Guide:     https://github.com/cmer/rails-dynamic-form-preview-pattern/blob/main/LLM.md
 *
 * @example
 *   <form data-controller="form-preview" data-form-preview-debounce-value="0">
 *     <%= form_preview_hidden_field %>
 *     <input data-action="blur->form-preview#preview">
 *     <textarea data-action="input->form-preview#preview" data-form-preview-debounce-value="300">
 *   </form>
 */
export default class extends Controller {
  /** @type {{ debounce: { type: NumberConstructor, default: number } }} */
  static values = { debounce: { type: Number, default: 0 } }

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

    const hadNoValidate = form.noValidate
    form.noValidate = true
    form.requestSubmit()
    form.noValidate = hadNoValidate

    formPreviewInput.remove()
  }

  disconnect() {
    clearTimeout(this.debounceTimer)
  }
}
