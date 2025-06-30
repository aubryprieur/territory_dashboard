puts "\n========== GÉNÉRATION DE 100 RÉPONSES POUR WEEKLY SCHEDULE =========="

# Récupérer l'enquête et la question
user_survey = UserSurvey.find(23)
question = user_survey.survey.questions.find_by(question_type: 'weekly_schedule')

if question.nil?
  puts "❌ Aucune question weekly_schedule trouvée dans cette enquête"
  exit
end

puts "📋 Question trouvée: #{question.title}"
puts "🎯 Génération de 100 réponses avec patterns réalistes..."

# Configuration de la question (jours et créneaux)
config = question.weekly_schedule_config
days = config[:days] || []
time_slots = config[:time_slots] || []

puts "📅 Jours: #{days.join(', ')}"
puts "⏰ Créneaux: #{time_slots.join(', ')}"

# Patterns réalistes pour une demande de garde d'enfants
# Définir des probabilités par créneau pour simuler des préférences réelles
probabilities = {
  # Matinée très demandée en semaine
  'Lundi_7h_9h' => 0.75,
  'Mardi_7h_9h' => 0.78,
  'Mercredi_7h_9h' => 0.45, # Moins car souvent pas école
  'Jeudi_7h_9h' => 0.80,
  'Vendredi_7h_9h' => 0.72,
  'Samedi_7h_9h' => 0.25,
  'Dimanche_7h_9h' => 0.15,

  # Milieu de matinée
  'Lundi_9h_12h' => 0.85,
  'Mardi_9h_12h' => 0.88,
  'Mercredi_9h_12h' => 0.60,
  'Jeudi_9h_12h' => 0.82,
  'Vendredi_9h_12h' => 0.75,
  'Samedi_9h_12h' => 0.35,
  'Dimanche_9h_12h' => 0.20,

  # Déjeuner modéré
  'Lundi_12h_14h' => 0.40,
  'Mardi_12h_14h' => 0.42,
  'Mercredi_12h_14h' => 0.70, # Plus pour les mercredis
  'Jeudi_12h_14h' => 0.38,
  'Vendredi_12h_14h' => 0.35,
  'Samedi_12h_14h' => 0.50,
  'Dimanche_12h_14h' => 0.45,

  # Après-midi variable
  'Lundi_14h_16h' => 0.50,
  'Mardi_14h_16h' => 0.52,
  'Mercredi_14h_16h' => 0.85, # Très demandé le mercredi
  'Jeudi_14h_16h' => 0.48,
  'Vendredi_14h_16h' => 0.40,
  'Samedi_14h_16h' => 0.60,
  'Dimanche_14h_16h' => 0.30,

  # Fin d'après-midi
  'Lundi_16h_18h' => 0.65,
  'Mardi_16h_18h' => 0.68,
  'Mercredi_16h_18h' => 0.90, # Peak le mercredi
  'Jeudi_16h_18h' => 0.70,
  'Vendredi_16h_18h' => 0.55,
  'Samedi_16h_18h' => 0.45,
  'Dimanche_16h_18h' => 0.25,

  # Soirée plus faible
  'Lundi_18h_20h' => 0.30,
  'Mardi_18h_20h' => 0.32,
  'Mercredi_18h_20h' => 0.25,
  'Jeudi_18h_20h' => 0.28,
  'Vendredi_18h_20h' => 0.45, # Plus élevé le vendredi soir
  'Samedi_18h_20h' => 0.55,
  'Dimanche_18h_20h' => 0.20,

  # Soirée tardive très faible
  'Lundi_soiree_20h_00h' => 0.08,
  'Mardi_soiree_20h_00h' => 0.10,
  'Mercredi_soiree_20h_00h' => 0.05,
  'Jeudi_soiree_20h_00h' => 0.12,
  'Vendredi_soiree_20h_00h' => 0.25, # Weekend
  'Samedi_soiree_20h_00h' => 0.35,
  'Dimanche_soiree_20h_00h' => 0.08,

  # Nuit très rare
  'Lundi_nuit_00h_6h' => 0.02,
  'Mardi_nuit_00h_6h' => 0.02,
  'Mercredi_nuit_00h_6h' => 0.01,
  'Jeudi_nuit_00h_6h' => 0.02,
  'Vendredi_nuit_00h_6h' => 0.05,
  'Samedi_nuit_00h_6h' => 0.08,
  'Dimanche_nuit_00h_6h' => 0.02,

  # "Pas ce jour-là" - opposé des autres créneaux
  'Lundi_pas_ce_jour_la' => 0.05,
  'Mardi_pas_ce_jour_la' => 0.03,
  'Mercredi_pas_ce_jour_la' => 0.15,
  'Jeudi_pas_ce_jour_la' => 0.04,
  'Vendredi_pas_ce_jour_la' => 0.08,
  'Samedi_pas_ce_jour_la' => 0.30,
  'Dimanche_pas_ce_jour_la' => 0.60
}

# Générer 100 réponses
100.times do |i|
  # Créer une réponse d'enquête
  survey_response = user_survey.survey_responses.create!(
    survey: user_survey.survey,
    session_id: SecureRandom.hex(16),
    started_at: rand(30.days).seconds.ago,
    completed_at: rand(30.days).seconds.ago + rand(1.hour),
    completed: true,
    ip_address: "192.168.1.#{rand(255)}",
    user_agent: "SeedBot/1.0"
  )

  # Générer les sélections pour cette réponse
  selected_options = []

  days.each do |day|
    time_slots.each do |time_slot|
      option_key = "#{day}_#{time_slot.parameterize.underscore}"
      probability = probabilities[option_key] || 0.1 # Défaut si non défini

      # Décider si cette option est sélectionnée basé sur la probabilité
      if rand < probability
        selected_options << option_key
      end
    end
  end

  # Assurer qu'au moins une option est sélectionnée (réaliste)
  if selected_options.empty?
    # Sélectionner un créneau au hasard parmi les plus probables
    popular_options = probabilities.select { |_, prob| prob > 0.5 }.keys
    selected_options << popular_options.sample if popular_options.any?
  end

  # Créer la réponse à la question
  question_response = survey_response.question_responses.create!(
    question: question,
    answer_data: selected_options,
    answer_text: selected_options.join(', ')
  )

  print "." if (i + 1) % 10 == 0
end

# Mettre à jour le compteur de réponses
user_survey.update!(response_count: user_survey.survey_responses.completed.count)

puts "\n\n✅ 100 réponses générées avec succès !"
puts "🎯 Patterns créés :"
puts "   🔥 TRÈS FORTE demande (>75%) : Mercredi 16h-18h, Mardi 9h-12h"
puts "   🔴 FORTE demande (50-75%) : Matinées en semaine, Mercredi après-midi"
puts "   🔵 DEMANDE MODÉRÉE (25-50%) : Déjeuners, Samedi après-midi"
puts "   ❄️ FAIBLE demande (<25%) : Soirées, Nuits, Dimanche"
puts "   ⚫ TRÈS FAIBLE (0-10%) : Nuits en semaine, Dimanche soir"
puts "\n🌈 Votre heatmap devrait maintenant montrer un beau dégradé bleu → rouge !"
puts "🔗 Rendez-vous sur: http://localhost:3000/user_surveys/23/results"
