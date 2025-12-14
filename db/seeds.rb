posts = [
  {
    title: "Introduction to Railss",
    body: "Rails is a web application framework that makes building websites fun and easy.",
    author: "John Smith",
    publish_on: Date.parse("2025-12-08")
  },
  {
    title: "Tips for Better Code",
    body: "Always write tests, use meaningful variable names, and keep your functions small.",
    author: "John Smith",
    publish_on: nil
  },
  {
    title: "Weekend Project Ideas",
    body: "Try building a todo app, a weather dashboard, or a simple blog to practice your skills.",
    author: "Alice Johnson",
    publish_on: nil
  }
]

Post.destroy_all
posts.each do |post_attrs|
  Post.find_or_create_by!(title: post_attrs[:title]) do |post|
    post.body = post_attrs[:body]
    post.author = post_attrs[:author]
    post.publish_on = post_attrs[:publish_on]
  end
end

puts "Created #{Post.count} posts"
