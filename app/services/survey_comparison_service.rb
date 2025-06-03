# app/services/survey_comparison_service.rb
class SurveyComparisonService
  attr_reader :user, :survey, :years

  def initialize(user, survey, years = nil)
    @user = user
    @survey = survey
    @years = years || available_years
  end

  def compare_by_years
    result = {
      survey: survey,
      years: years,
      questions: {}
    }

    survey.questions.each do |question|
      result[:questions][question.id] = {
        title: question.title,
        type: question.question_type,
        data: collect_question_data(question)
      }
    end

    result
  end

  def response_rates_by_year
    years.map do |year|
      user_survey = user_surveys_for_year(year).first
      next unless user_survey

      {
        year: year,
        response_count: user_survey.response_count,
        response_rate: calculate_response_rate(user_survey)
      }
    end.compact
  end

  def trends_for_question(question_id)
    question = survey.questions.find(question_id)
    return {} unless question

    case question.question_type
    when 'single_choice', 'yes_no'
      trends_for_choice_question(question)
    when 'scale', 'numeric'
      trends_for_numeric_question(question)
    else
      {}
    end
  end

  private

  def available_years
    user.user_surveys
        .where(survey: survey)
        .where.not(response_count: 0)
        .pluck(:year)
        .sort
  end

  def user_surveys_for_year(year)
    user.user_surveys.where(survey: survey, year: year)
  end

  def collect_question_data(question)
    data_by_year = {}

    years.each do |year|
      user_survey = user_surveys_for_year(year).first
      next unless user_survey

      responses = user_survey.survey_responses
                            .completed
                            .joins(:question_responses)
                            .where(question_responses: { question: question })

      data_by_year[year] = calculate_stats_for_question(question, responses)
    end

    data_by_year
  end

  def calculate_stats_for_question(question, responses)
    case question.question_type
    when 'single_choice', 'yes_no'
      responses.group('question_responses.answer_text').count
    when 'multiple_choice'
      all_answers = responses.pluck('question_responses.answer_data').flatten
      all_answers.group_by(&:itself).transform_values(&:count)
    when 'scale', 'numeric'
      values = responses.pluck('question_responses.answer_text').map(&:to_f)
      {
        average: values.any? ? (values.sum / values.count).round(2) : 0,
        count: values.count,
        min: values.min || 0,
        max: values.max || 0
      }
    else
      { count: responses.count }
    end
  end

  def trends_for_choice_question(question)
    trends = {}

    question.question_options.each do |option|
      trends[option.value] = years.map do |year|
        data = collect_question_data(question)[year]
        next unless data

        total = data.values.sum
        count = data[option.value] || 0
        percentage = total > 0 ? (count.to_f / total * 100).round(1) : 0

        { year: year, count: count, percentage: percentage }
      end.compact
    end

    trends
  end

  def trends_for_numeric_question(question)
    years.map do |year|
      data = collect_question_data(question)[year]
      next unless data && data[:count] > 0

      {
        year: year,
        average: data[:average],
        count: data[:count],
        min: data[:min],
        max: data[:max]
      }
    end.compact
  end

  def calculate_response_rate(user_survey)
    # À adapter selon votre logique de calcul du taux de réponse
    # Par exemple, si vous avez un nombre cible de répondants
    user_survey.response_count
  end
end
