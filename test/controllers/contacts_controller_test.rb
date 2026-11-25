require "test_helper"

class ContactsControllerTest < ActionDispatch::IntegrationTest
  def valid_params(overrides = {})
    { contact_message: {
      subject: "presentation", name: "Camille Martin", organization: "Ville de Lille",
      email: "camille.martin@example.org", phone: "", territory: "Lille",
      message: "Bonjour, nous souhaitons une présentation de l'outil.", website: ""
    }.merge(overrides) }
  end

  test "le formulaire est accessible sans connexion" do
    get contact_path
    assert_response :success
    assert_select "form[action='#{contact_path}']"
  end

  test "l'objet est présélectionné depuis l'URL" do
    get contact_path(objet: "devis")
    assert_select "option[selected][value='devis']"
  end

  test "un message valide est envoyé par e-mail avec réponse au visiteur" do
    assert_emails 1 do
      post contact_path, params: valid_params
    end
    assert_redirected_to contact_sent_path
    mail = ActionMailer::Base.deliveries.last
    assert_equal ["camille.martin@example.org"], mail.reply_to
    assert_match "Ville de Lille", mail.subject
  end

  test "un message incomplet réaffiche le formulaire sans envoi" do
    assert_no_emails do
      post contact_path, params: valid_params(email: "pas-une-adresse", message: "")
    end
    assert_response :unprocessable_entity
  end

  test "le champ piège bloque l'envoi sans le signaler" do
    assert_no_emails do
      post contact_path, params: valid_params(website: "http://spam.example")
    end
    assert_redirected_to contact_sent_path
  end
end
