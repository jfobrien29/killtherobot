export const generateAnswerPrompt = `Please create and return one line exiting, action-packed question in the style of Cards Against Humanity where there is one blank to fill,
using the template of hero_journey_stages below, the theme={theme} and the answer from last_voted_answer below. Never reference the 
current stage name in the question created. Do not return meta observations on what you do.
game_state:
  total_questions: 12
  theme: {theme}
  hero_journey_stage: {stage}
  last_voted_answer: {last_voted_answer}
hero_journey_stages:
  1. ordinary_world
  2. call_to_adventure
  3. refusal_of_the_call
  4. meeting_the_mentor
  5. crossing_the_threshold
  6. tests_allies_enemies
  7. approach_to_inmost_cave
  8. ordeal
  9. reward
  10. the_road_back
  11. resurrection
  12. return_with_elixir`;
