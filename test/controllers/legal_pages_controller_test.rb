require "test_helper"

class LegalPagesControllerTest < ActionDispatch::IntegrationTest
  test "les pages légales sont accessibles sans connexion" do
    [mentions_legales_path, confidentialite_path, cgu_path, sources_donnees_path, accessibilite_path].each do |path|
      get path
      assert_response :success, "#{path} devrait répondre 200"
    end
  end

  test "les mentions légales indiquent l'éditeur et l'hébergeur" do
    get mentions_legales_path
    assert_match "329 070 809", response.body
    assert_match "Scalingo", response.body
  end
end
