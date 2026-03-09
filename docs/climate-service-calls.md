# Climate Service Calls

Reference for Home Assistant climate entities used by the Home Climate integration.

## Turn off climate device

```yaml
action: climate.turn_off
target:
  entity_id: climate.minisplit_blank_test
data: {}
```

## Turn on climate device

```yaml
action: climate.turn_on
target:
  entity_id:
    - climate.minisplit_blank_test
data: {}
```

## Set fan mode

```yaml
action: climate.set_fan_mode
data:
  fan_mode: high
target:
  entity_id: climate.ir_bridge_mini_split
```

## Set target temperature with mode

```yaml
action: climate.set_temperature
target:
  entity_id:
    - climate.ir_bridge_mini_split
data:
  temperature: 82
  hvac_mode: heat
```

## Set mode only

```yaml
action: climate.set_hvac_mode
target:
  entity_id: climate.ir_bridge_mini_split
data:
  hvac_mode: cool
```
