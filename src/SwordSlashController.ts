
import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Sword Slash Controller',

  stateMachine: ({world, eid, defineState}) => {
    const targetName = 'sonargaon-poster'
    const slashEvent = 'sonargaonSwordSwing'

    let targetVisible = false
    let gateOpened = false
    let swinging = false

    let swingTimer: number | undefined
    let returnTimer: number | undefined

    // Save the rig's original rotation.
    const original = ecs.Quaternion.get(world, eid)

    const restRotation = {
      x: original?.x ?? 0,
      y: original?.y ?? 0,
      z: original?.z ?? 0,
      w: original?.w ?? 1,
    }

    const clearSwingTimers = () => {
      if (swingTimer !== undefined) {
        window.clearTimeout(swingTimer)
        swingTimer = undefined
      }

      if (returnTimer !== undefined) {
        window.clearTimeout(returnTimer)
        returnTimer = undefined
      }
    }

    const stopSwing = () => {
      clearSwingTimers()

      if (ecs.RotateAnimation.has(world, eid)) {
        ecs.RotateAnimation.remove(world, eid)
      }

      // Restore the saved pose without changing position.
      ecs.Quaternion.set(world, eid, restRotation)

      swinging = false
    }

    const playSlash = () => {
      if (!gateOpened || swinging) return

      swinging = true
      stopExistingAnimation()

      // Phase 1: quick diagonal sword strike.
      ecs.RotateAnimation.set(world, eid, {
        fromX: 0,
        fromY: 0,
        fromZ: 0,
        toX: 35,
        toY: 0,
        toZ: -55,
        autoFrom: true,
        duration: 160,
        loop: false,
        reverse: false,
        easeIn: true,
        easeOut: true,
        easingFunction: 'Cubic',
      })

      swingTimer = window.setTimeout(() => {
        swingTimer = undefined

        if (ecs.RotateAnimation.has(world, eid)) {
          ecs.RotateAnimation.remove(world, eid)
        }

        // Phase 2: smoothly return to the resting orientation.
        ecs.RotateAnimation.set(world, eid, {
          fromX: 0,
          fromY: 0,
          fromZ: 0,
          toX: 0,
          toY: 0,
          toZ: 0,
          autoFrom: true,
          duration: 200,
          loop: false,
          reverse: false,
          easeIn: true,
          easeOut: true,
          easingFunction: 'Cubic',
        })

        returnTimer = window.setTimeout(() => {
          returnTimer = undefined

          if (ecs.RotateAnimation.has(world, eid)) {
            ecs.RotateAnimation.remove(world, eid)
          }

          ecs.Quaternion.set(world, eid, restRotation)
          swinging = false
        }, 220)
      }, 170)
    }

    // Reset any previous animation before a new swing.
    const stopExistingAnimation = () => {
      clearSwingTimers()

      if (ecs.RotateAnimation.has(world, eid)) {
        ecs.RotateAnimation.remove(world, eid)
      }

      ecs.Quaternion.set(world, eid, restRotation)
    }

    defineState('waiting')
      .initial()

      .onEnter(() => {
        targetVisible = false
        gateOpened = false

        stopSwing()

        // Initially hide the camera-attached sword.
        ecs.Hidden.set(world, eid, {})
      })

      // Remember when our poster is recognized.
      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_FOUND,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== targetName) return

          targetVisible = true

          if (gateOpened) {
            ecs.Hidden.remove(world, eid)
          }
        },
      )

      // IMPORTANT:
      // Losing image tracking must not hide or reset a
      // sword that is attached to the camera.
      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_LOST,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== targetName) return

          targetVisible = false

          // Do not hide the sword here.
          // Do not reset its rotation here.
        },
      )

      // Reveal the sword when the gate opens.
      .listen(
        world.events.globalId,
        ecs.events.GLTF_ANIMATION_FINISHED,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== 'open') return

          gateOpened = true

          // Once unlocked, keep the sword camera-attached.
          ecs.Hidden.remove(world, eid)
        },
      )

      // Play the sword swing after a confirmed hit.
      .listen(
        world.events.globalId,
        slashEvent,
        () => {
          playSlash()
        },
      )
  },
})
