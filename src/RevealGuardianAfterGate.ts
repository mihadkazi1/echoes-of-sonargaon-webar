
import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Reveal Guardian After Gate',

  stateMachine: ({world, eid, defineState}) => {
    let guardianRevealed = false

    defineState('waiting')
      .initial()

      // Hide the guardian and pause its idle animation initially.
      .onEnter(() => {
        guardianRevealed = false

        ecs.Hidden.set(world, eid, {})

        ecs.GltfModel.mutate(world, eid, (model) => {
          model.animationClip = 'idle'
          model.time = 0
          model.timeScale = 1
          model.paused = true
          model.loop = true
          model.reverse = false
          model.repetitions = -1
          return false
        })
      })

      // Wait for the gate's opening animation to finish.
      .listen(
        world.events.globalId,
        ecs.events.GLTF_ANIMATION_FINISHED,
        (event) => {
          const animationData = event.data as {name?: string}

          // Ignore other animation events.
          if (animationData.name !== 'open') return

          // Prevent the guardian from being revealed more than once.
          if (guardianRevealed) return

          guardianRevealed = true

          // Reveal the enemy.
          ecs.Hidden.remove(world, eid)

          // Start its idle animation.
          ecs.GltfModel.mutate(world, eid, (model) => {
            model.animationClip = 'idle'
            model.time = 0
            model.timeScale = 1
            model.paused = false
            model.loop = true
            model.reverse = false
            model.repetitions = -1
            return false
          })

          console.log('The Cursed Guardian has appeared!')
        },
      )
  },
})
