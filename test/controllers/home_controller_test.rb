require "test_helper"

class HomeControllerTest < ActionDispatch::IntegrationTest
  test "la page d'accueil publique s'affiche" do
    get root_url
    assert_response :success
  end
end
