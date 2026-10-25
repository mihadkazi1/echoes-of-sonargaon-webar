
import * as ecs from '@8thwall/ecs'

const GATE_HITBOX_TAPPED = 'sonargaonGateHitboxTapped'

ecs.registerComponent({
  name: 'Gate Hitbox Tap',

  stateMachine: ({world, eid, defineState}) => {
    defineState('ready')
      .initial()
      .listen(eid, ecs.input.SCREEN_TOUCH_START, () => {
        world.events.dispatch(
          world.events.globalId,
          GATE_HITBOX_TAPPED,
          {},
        )

        console.log('Gate hitbox tapped')
      })
  },
})
