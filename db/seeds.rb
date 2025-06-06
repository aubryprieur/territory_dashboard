puts "\n========== NETTOYAGE DE LA BASE DE DONNÉES =========="

# Supprimer toutes les données liées aux enquêtes
puts "Suppression des données d'enquêtes existantes..."
QuestionResponse.destroy_all
SurveyResponse.destroy_all
UserSurvey.destroy_all
QuestionOption.destroy_all
Question.destroy_all
SurveySection.destroy_all
Survey.destroy_all
puts "✓ Données d'enquêtes supprimées"

# Optionnel : Supprimer les utilisateurs de test (garder uniquement si vous voulez réinitialiser complètement)
# Décommentez les lignes suivantes si vous voulez aussi supprimer les utilisateurs
# puts "Suppression des utilisateurs de test..."
# User.where(email: ['admin@example.com', 'mairie.bordeaux@example.com']).destroy_all
# puts "✓ Utilisateurs de test supprimés"

puts "========== CRÉATION DES DONNÉES DE TEST ==========\n\n"

puts "Création d'une enquête complète avec tous les types de questions..."

# Créer un super admin s'il n'existe pas
super_admin = User.find_or_create_by!(email: 'admin@example.com') do |user|
  user.password = 'password123'
  user.role = 'super_admin'
  user.territory_type = nil
  user.territory_code = nil
  user.territory_name = nil
end

# Créer un utilisateur commune
commune_user = User.find_or_create_by!(email: 'mairie.bordeaux@example.com') do |user|
  user.password = 'password123'
  user.role = 'user'
  user.territory_type = 'commune'
  user.territory_code = '33063'
  user.territory_name = 'Bordeaux'
end

# Créer l'enquête principale
survey = Survey.find_or_create_by!(title: "Enquête satisfaction des services municipaux") do |s|
  s.description = "Évaluation annuelle de la satisfaction des citoyens concernant les services de la commune"
  s.created_by = super_admin
  s.published = true
  s.published_at = 1.year.ago
  s.welcome_message = "Bienvenue dans cette enquête de satisfaction. Votre avis compte pour améliorer nos services."
  s.thank_you_message = "Merci pour votre participation ! Vos réponses nous aideront à mieux vous servir."
  s.allow_anonymous = true
  s.show_progress_bar = true
end

# Section 1: Informations générales
section1 = survey.survey_sections.find_or_create_by!(title: "Informations générales") do |s|
  s.description = "Quelques questions pour mieux vous connaître"
  s.position = 1
  s.required = true
end

# Question 1: Choix unique - Tranche d'âge
q1 = section1.questions.find_or_create_by!(title: "Dans quelle tranche d'âge vous situez-vous ?") do |q|
  q.question_type = 'single_choice'
  q.position = 1
  q.required = true
end

['Moins de 18 ans', '18-25 ans', '26-35 ans', '36-45 ans', '46-55 ans', '56-65 ans', 'Plus de 65 ans'].each_with_index do |option, index|
  q1.question_options.find_or_create_by!(text: option) do |o|
    o.value = option.parameterize.underscore
    o.position = index + 1
  end
end

# Question 2: Oui/Non
q2 = section1.questions.find_or_create_by!(title: "Êtes-vous résident permanent de la commune ?") do |q|
  q.question_type = 'yes_no'
  q.position = 2
  q.required = true
end

# Question 3: Email
q3 = section1.questions.find_or_create_by!(title: "Votre email (optionnel)") do |q|
  q.question_type = 'email'
  q.position = 3
  q.required = false
  q.description = "Uniquement si vous souhaitez être informé des résultats"
end

# Section 2: Évaluation des services
section2 = survey.survey_sections.find_or_create_by!(title: "Évaluation des services municipaux") do |s|
  s.description = "Notez votre satisfaction pour chaque service"
  s.position = 2
  s.required = false
end

# Question 4: Échelle - Satisfaction générale
q4 = section2.questions.find_or_create_by!(title: "Quelle est votre satisfaction générale concernant les services de la mairie ?") do |q|
  q.question_type = 'scale'
  q.position = 1
  q.required = true
  q.options = {
    'scale_min' => 1,
    'scale_max' => 10,
    'scale_step' => 1,
    'scale_min_label' => 'Très insatisfait',
    'scale_max_label' => 'Très satisfait'
  }
end

(1..10).each do |i|
  q4.question_options.find_or_create_by!(text: i.to_s) do |o|
    o.value = i.to_s
    o.position = i
  end
end

# Question 5: Choix multiples
q5 = section2.questions.find_or_create_by!(title: "Quels services avez-vous utilisés cette année ?") do |q|
  q.question_type = 'multiple_choice'
  q.position = 2
  q.required = false
  q.description = "Sélectionnez tous les services concernés"
end

['État civil', 'Urbanisme', 'École et périscolaire', 'Culture', 'Sports', 'Social/CCAS', 'Espaces verts', 'Voirie'].each_with_index do |service, index|
  q5.question_options.find_or_create_by!(text: service) do |o|
    o.value = service.parameterize.underscore
    o.position = index + 1
  end
end

# Question 6: Nombre
q6 = section2.questions.find_or_create_by!(title: "Combien de fois avez-vous contacté la mairie cette année ?") do |q|
  q.question_type = 'numeric'
  q.position = 3
  q.required = true
end

# Section 3: Suggestions d'amélioration
section3 = survey.survey_sections.find_or_create_by!(title: "Vos suggestions") do |s|
  s.description = "Aidez-nous à nous améliorer"
  s.position = 3
  s.required = false
end

# Question 7: Texte court
q7 = section3.questions.find_or_create_by!(title: "Quel service devrait être prioritairement amélioré ?") do |q|
  q.question_type = 'text'
  q.position = 1
  q.required = false
end

# Question 8: Texte long
q8 = section3.questions.find_or_create_by!(title: "Avez-vous des suggestions spécifiques pour améliorer nos services ?") do |q|
  q.question_type = 'long_text'
  q.position = 2
  q.required = false
  q.description = "N'hésitez pas à détailler vos idées"
end

# Question 9: Téléphone
q9 = section3.questions.find_or_create_by!(title: "Téléphone de contact (optionnel)") do |q|
  q.question_type = 'phone'
  q.position = 3
  q.required = false
  q.description = "Si vous souhaitez être recontacté"
end

# Question 10: Date
q10 = section3.questions.find_or_create_by!(title: "Date de votre dernière visite en mairie") do |q|
  q.question_type = 'date'
  q.position = 4
  q.required = false
end

puts "Enquête créée avec #{survey.questions.count} questions"

# Créer les instances d'enquête pour l'utilisateur commune
[2022, 2023, 2024].each do |year|
  user_survey = commune_user.user_surveys.find_or_create_by!(survey: survey, year: year) do |us|
    us.starts_at = Date.new(year, 3, 1).beginning_of_day
    us.ends_at = Date.new(year, 5, 31).end_of_day
    # Toutes les enquêtes sont terminées car nous sommes en 2025
    us.status = 'closed'
    us.custom_welcome_message = "Habitants de Bordeaux, votre avis compte ! Participez à l'enquête #{year}."
    # Varier le nombre de réponses selon l'année
    us.response_count = case year
                       when 2022 then 85
                       when 2023 then 100
                       when 2024 then 125
                       end
  end

  puts "Création de #{user_survey.response_count} réponses pour l'année #{year}..."

  # Options pour les réponses aléatoires
  age_options = q1.question_options.pluck(:value)
  service_options = q5.question_options.pluck(:value)
  suggestions_services = ['État civil', 'Urbanisme', 'Accueil', 'Propreté', 'Stationnement', 'Communication']
  suggestions_textes = [
    "Améliorer les horaires d'ouverture",
    "Développer les services en ligne",
    "Réduire les temps d'attente",
    "Former le personnel à l'accueil",
    "Moderniser les locaux",
    "Simplifier les démarches administratives",
    "Mieux informer sur les services disponibles",
    "Créer une application mobile",
    "Proposer des rendez-vous en ligne",
    "Améliorer l'accessibilité PMR"
  ]

  user_survey.response_count.times do |i|
    # Créer la réponse principale
    response = user_survey.survey_responses.create!(
      survey: survey,
      session_id: SecureRandom.hex(16),
      completed: true,
      started_at: user_survey.starts_at + rand(0..60).days + rand(0..23).hours,
      completed_at: nil, # sera défini après
      ip_address: "192.168.1.#{rand(1..254)}",
      user_agent: ["Mozilla/5.0", "Chrome/91.0", "Safari/14.0"].sample
    )

    # Définir completed_at après started_at
    response.update!(completed_at: response.started_at + rand(5..20).minutes)

    # Réponses aux questions
    # Q1 - Âge (avec distribution réaliste)
    age_distribution = [0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6]
    response.question_responses.create!(
      question: q1,
      answer_text: age_options[age_distribution.sample]
    )

    # Q2 - Résident permanent (évolution : plus de résidents permanents au fil des années)
    resident_rate = case year
                   when 2022 then 0.75
                   when 2023 then 0.80
                   when 2024 then 0.85
                   end
    response.question_responses.create!(
      question: q2,
      answer_text: rand < resident_rate ? 'yes' : 'no'
    )

    # Q3 - Email (30% remplissent)
    if rand < 0.3
      response.question_responses.create!(
        question: q3,
        answer_text: "citoyen#{i}@example.com"
      )
    end

    # Q4 - Satisfaction (amélioration progressive au fil des années)
    satisfaction_base = case year
                       when 2022 then [4, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8]
                       when 2023 then [5, 5, 6, 6, 6, 7, 7, 7, 7, 8, 8, 9]
                       when 2024 then [5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 10]
                       end
    satisfaction = satisfaction_base.sample.to_s
    response.question_responses.create!(
      question: q4,
      answer_text: satisfaction
    )

    # Q5 - Services utilisés (1 à 4 services)
    services_used = service_options.sample(rand(1..4))
    response.question_responses.create!(
      question: q5,
      answer_data: services_used,
      answer_text: services_used.join(', ')
    )

    # Q6 - Nombre de contacts (diminution progressive grâce à la digitalisation)
    contacts_base = case year
                   when 2022 then [1, 1, 2, 2, 2, 3, 3, 4, 5, 6]
                   when 2023 then [0, 1, 1, 1, 2, 2, 2, 3, 3, 4]
                   when 2024 then [0, 0, 1, 1, 1, 1, 2, 2, 2, 3]
                   end
    contacts = contacts_base.sample
    response.question_responses.create!(
      question: q6,
      answer_text: contacts.to_s
    )

    # Q7 - Service à améliorer (60% répondent)
    if rand < 0.6
      response.question_responses.create!(
        question: q7,
        answer_text: suggestions_services.sample
      )
    end

    # Q8 - Suggestions longues (40% répondent)
    if rand < 0.4
      response.question_responses.create!(
        question: q8,
        answer_text: suggestions_textes.sample(rand(1..3)).join(". ") + "."
      )
    end

    # Q9 - Téléphone (20% remplissent)
    if rand < 0.2
      response.question_responses.create!(
        question: q9,
        answer_text: "06 #{rand(10..99)} #{rand(10..99)} #{rand(10..99)} #{rand(10..99)}"
      )
    end

    # Q10 - Date de visite (50% remplissent)
    if rand < 0.5
      visit_date = response.started_at - rand(1..180).days
      response.question_responses.create!(
        question: q10,
        answer_text: visit_date.to_date.to_s
      )
    end
  end

  puts "✓ #{user_survey.response_count} réponses créées pour l'année #{year}"
end

puts "\n✅ Seeds terminées avec succès !"
puts "Connectez-vous avec :"
puts "  - Super Admin: admin@example.com / password123"
puts "  - Commune: mairie.bordeaux@example.com / password123"
