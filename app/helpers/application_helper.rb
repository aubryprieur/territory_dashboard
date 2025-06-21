module ApplicationHelper
  def admin_stats
    {
      total_users: User.count,
      active_users: User.active.count,
      suspended_users: User.suspended.count,
      commune_users: User.where(territory_type: 'commune').count,
      epci_users: User.where(territory_type: 'epci').count,
      total_surveys: Survey.count,
      published_surveys: Survey.where(published: true).count,
      active_user_surveys: UserSurvey.count,
      survey_responses: SurveyResponse.count
    }
  end

  def admin_badge_color(type)
    case type
    when 'super_admin'
      'bg-red-100 text-red-800'
    when 'admin'
      'bg-blue-100 text-blue-800'
    when 'user'
      'bg-green-100 text-green-800'
    else
      'bg-gray-100 text-gray-800'
    end
  end
end
