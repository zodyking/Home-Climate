# Turn off climate device
action: climate.turn_off
target:
  entity_id: climate.minisplit_blank_test
data: {}

# Turn on Climate device
action: climate.turn_on
target:
  entity_id:
    - climate.minisplit_blank_test
data: {}

# Set fan mode
action: climate.set_fan_mode
data:
  fan_mode: high
target:
  entity_id: climate.ir_bridge_mini_split

# set target tempature w/mode
action: climate.set_temperature
target:
  entity_id:
    - climate.ir_bridge_mini_split
data:
  temperature: 82
  hvac_mode: heat

#Set mode only
action: climate.set_hvac_mode
target:
  entity_id:
    - climate.ir_bridge_mini_split
data:
  hvac_mode: cool
