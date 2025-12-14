import { Controller } from "@hotwired/stimulus"

/**
 * Stimulus controller for live form preview functionality.
 * Works with `FormPreviewHelper` on the server side.
 * See README.md for full documentation and usage examples.
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

    form.requestSubmit()

    formPreviewInput.remove()
  }

  disconnect() {
    clearTimeout(this.debounceTimer)
  }
}
