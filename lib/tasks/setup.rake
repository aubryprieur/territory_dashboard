namespace :setup do
  desc "Creates a super admin user"
  task create_super_admin: :environment do
    email = ENV['SUPER_ADMIN_EMAIL'] || 'admin@example.com'
    password = ENV['SUPER_ADMIN_PASSWORD'] || 'password'

    if User.find_by(email: email)
      puts "Super admin with email #{email} already exists"
    else
      user = User.create!(
        email: email,
        password: password,
        password_confirmation: password,
        role: :super_admin
      )
      puts "Super admin created with email: #{email} and role: #{user.role}"
    end
  end
end
