
import * as ecs from '@8thwall/ecs'

const GATE_HITBOX_TAPPED = 'sonargaonGateHitboxTapped'

ecs.registerComponent({
  name: 'Tap To Open Gate',

  stateMachine: ({world, eid, defineState}) => {
    const targetName = 'sonargaon-poster'

    let targetVisible = false
    let openingStarted = false

    // Remove any previous instruction created during reloads.
    document.getElementById('sonargaon-gate-hint')?.remove()
    document.getElementById('sonargaon-gate-ui')?.remove()

    // Visual instruction only. It is not a button.
    const hint = document.createElement('div')
    hint.id = 'sonargaon-gate-hint'
    hint.textContent = 'TAP THE GATE TO OPEN'

    Object.assign(hint.style, {
      position: 'fixed',
      left: '50%',
      bottom: '9%',
      transform: 'translateX(-50%)',
      width: 'min(86vw, 340px)',
      boxSizing: 'border-box',
      padding: '13px 18px',
      border: '1px solid #CBA65E',
      borderRadius: '12px',
      background: 'rgba(7,39,36,0.94)',
      color: '#F8E5B3',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      letterSpacing: '0.08em',
      textAlign: 'center',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '2147483000',
    })

    document.body.appendChild(hint)

    // Shared handler for direct gate taps and hitbox taps.
    const startOpening = () => {
      if (!targetVisible || openingStarted) return

      openingStarted = true
      world.events.dispatch(
  world.events.globalId,
  'sonargaonGateOpening',
  {},
)
      hint.style.display = 'none'

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

      console.log('Sonargaon gate opening')
    }

    defineState('waiting')
      .initial()
      .onEnter(() => {
        targetVisible = false
        openingStarted = false
        hint.style.display = 'none'

        // Start the gate in its closed position.
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

      // Show the instruction when the correct poster is tracked.
      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_FOUND,
        (event) => {
          const data = event.data as {name?: string}

          if (data.name !== targetName) return

          targetVisible = true

          if (!openingStarted) {
            hint.style.display = 'block'
          }
        },
      )

      // Hide the instruction if tracking is lost.
      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_LOST,
        (event) => {
          const data = event.data as {name?: string}

          if (data.name !== targetName) return

          targetVisible = false
          hint.style.display = 'none'
        },
      )

      // Direct tap on the gate model.
      .listen(eid, ecs.input.SCREEN_TOUCH_START, () => {
        startOpening()
      })

      // Tap on the separate invisible hitbox.
      .listen(
        world.events.globalId,
        GATE_HITBOX_TAPPED,
        () => {
          startOpening()
        },
      )
  },
})
