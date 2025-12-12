module ApplicationHelper
  def render_markdown(markdown_text)
    return "".html_safe if markdown_text.blank?

    require "rdoc"

    document = RDoc::Markdown.new.parse(markdown_text.to_s)
    RDoc::Markup::ToHtml.new(RDoc::Options.new).convert(document).html_safe
  end
end
