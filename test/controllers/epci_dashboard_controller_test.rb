require "test_helper"

class EpciDashboardControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get epci_dashboard_index_url
    assert_response :success
  end
end
