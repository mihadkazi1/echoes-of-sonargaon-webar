
import * as ecs from '@8thwall/ecs'

const GUARDIAN_DEFEATED_EVENT = 'sonargaonGuardianDefeated'
const RELIC_COLLECTED_EVENT = 'sonargaonRelicCollected'

ecs.registerComponent({
  name: 'Tap To Collect Relic',

  stateMachine: ({world, eid, defineState}) => {
    const targetName = 'sonargaon-poster'

    let targetVisible = false
    let relicUnlocked = false
    let opening = false
    let collected = false

    // Remove old development prompts.
    document.getElementById('sonargaon-relic-prompt')?.remove()
    document.getElementById('sonargaon-relic-toast')?.remove()

    // Instruction only; the 3D relic box receives the tap.
    const prompt = document.createElement('div')
    prompt.id = 'sonargaon-relic-prompt'
    prompt.textContent = 'GUARDIAN DEFEATED — TAP THE RELIC BOX TO OPEN'

    Object.assign(prompt.style, {
      position: 'fixed',
      bottom: '7%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(88vw, 340px)',
      boxSizing: 'border-box',
      padding: '14px 16px',
      border: '1px solid #CBA65E',
      borderRadius: '12px',
      background: 'rgba(7,39,36,0.96)',
      color: '#F8E5B3',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      letterSpacing: '0.05em',
      lineHeight: '1.5',
      textAlign: 'center',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '2147483000',
    })

    document.body.appendChild(prompt)

    const updatePrompt = () => {
      const shouldShow =
        targetVisible && relicUnlocked && !collected

      prompt.style.display = shouldShow ? 'block' : 'none'

      if (opening) {
        prompt.textContent = 'OPENING THE RELIC BOX...'
      } else {
        prompt.textContent =
          'GUARDIAN DEFEATED — TAP THE RELIC BOX TO OPEN'
      }
    }

    defineState('waiting')
      .initial()

      .onEnter(() => {
        targetVisible = false
        relicUnlocked = false
        opening = false
        collected = false

        prompt.style.display = 'none'

        // Hide the box at the beginning.
        ecs.Hidden.set(world, eid, {})

        // Prepare its existing open animation at the start.
        // Paused at time 0 means it is ready in its closed pose.
        ecs.GltfModel.mutate(world, eid, (model) => {
          model.animationClip = 'open'
          model.time = 0
          model.timeScale = 1
          model.paused = true
          model.loop = false
          model.reverse = false
          model.repetitions = 0
          return false
        })
      })

      // Recognize the Sonargaon poster.
      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_FOUND,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== targetName) return

          targetVisible = true

          if (relicUnlocked && !collected) {
            ecs.Hidden.remove(world, eid)
          }

          updatePrompt()
        },
      )

      // Hide the instruction when the poster is no longer tracked.
      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_LOST,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== targetName) return

          targetVisible = false
          prompt.style.display = 'none'
        },
      )

      // Unlock the relic box after the guardian is defeated.
      .listen(
        world.events.globalId,
        GUARDIAN_DEFEATED_EVENT,
        () => {
          relicUnlocked = true

          if (targetVisible && !collected) {
            ecs.Hidden.remove(world, eid)
          }

          updatePrompt()
        },
      )

      // The player taps the actual 3D box.
      .listen(
        eid,
        ecs.input.SCREEN_TOUCH_START,
        () => {
          if (
            !targetVisible ||
            !relicUnlocked ||
            opening ||
            collected
          ) {
            return
          }

          opening = true
          updatePrompt()

          // Play ONLY the GLB model's existing open animation.
          ecs.GltfModel.mutate(world, eid, (model) => {
            model.animationClip = 'open'
            model.time = 0
            model.timeScale = 1
            model.paused = false
            model.loop = false
            model.reverse = false
            model.repetitions = 0
            return false
          })

          console.log('Relic box opening...')
        },
      )

      // Wait for the actual GLB opening animation to finish.
      .listen(
        eid,
        ecs.events.GLTF_ANIMATION_FINISHED,
        (event) => {
          const data = event.data as {name?: string}

          if (data.name !== 'open' || !opening) return

          opening = false
          collected = true

          // Hide the box after its animation finishes.
          ecs.Hidden.set(world, eid, {})
          updatePrompt()

          // Reveal the treasure chest.
          world.events.dispatch(
            world.events.globalId,
            RELIC_COLLECTED_EVENT,
            {relic: 'Sonargaon_Relic'},
          )

          console.log('Relic box opened — treasure revealed!')
        },
      )
  },
})
