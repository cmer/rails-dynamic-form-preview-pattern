class AddPublishOnToPosts < ActiveRecord::Migration[8.1]
  def change
    add_column :posts, :publish_on, :date
  end
end
