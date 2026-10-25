
import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Sword Touch Attack',

  stateMachine: ({world, eid, defineState}) => {
    const targetName = 'sonargaon-poster'
    let targetVisible = false
    let gateOpened = false

    defineState('waiting')
      .initial()

      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_FOUND,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== targetName) return
          targetVisible = true
        },
      )

      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_LOST,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== targetName) return
          targetVisible = false
        },
      )

      .listen(
        world.events.globalId,
        ecs.events.GLTF_ANIMATION_FINISHED,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name === 'open') gateOpened = true
        },
      )

      // Tap the visible 3D sword itself to request an attack.
      .listen(eid, ecs.input.SCREEN_TOUCH_START, () => {
        if (!targetVisible || !gateOpened) return

        world.events.dispatch(
          world.events.globalId,
          'sonargaonPlayerSwordAttack',
          {},
        )
      })
  },
})
