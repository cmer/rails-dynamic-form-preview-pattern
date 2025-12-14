class Post < ApplicationRecord
  validates :title, :body, :publish_on, :author, presence: true
end
