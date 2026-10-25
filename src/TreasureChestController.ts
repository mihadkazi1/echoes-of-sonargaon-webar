
import * as ecs from '@8thwall/ecs'

const RELIC_COLLECTED_EVENT = 'sonargaonRelicCollected'
const NEXT_LEVEL_EVENT = 'sonargaonNextLevelRequested'

ecs.registerComponent({
  name: 'Treasure Chest Controller',

  stateMachine: ({world, eid, defineState}) => {
    const targetName = 'sonargaon-poster'

    let targetVisible = false
    let treasureUnlocked = false
    let treasureRevealed = false
    let riseFinished = false
    let nextLevelRequested = false

    let riseTimer: number | undefined
    let glowTimer: number | undefined
    let glowStep = 0

    const position = ecs.Position.get(world, eid)
    const baseX = position?.x ?? 0
    const baseY = position?.y ?? 0
    const baseZ = position?.z ?? 0

    document.getElementById('sonargaon-chest-hint')?.remove()
    document.getElementById('sonargaon-next-level')?.remove()

    // Bottom-screen instruction.
    const hint = document.createElement('div')
    hint.id = 'sonargaon-chest-hint'
    hint.textContent = 'THE TREASURE EMERGES...'

    Object.assign(hint.style, {
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
      letterSpacing: '0.06em',
      textAlign: 'center',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '2147483000',
    })

    document.body.appendChild(hint)

    // This becomes the only clickable control after the reward appears.
    const nextButton = document.createElement('button')
    nextButton.id = 'sonargaon-next-level'
    nextButton.type = 'button'
    nextButton.textContent = 'VICTORY — TAP TO NEXT LEVEL'

    Object.assign(nextButton.style, {
      position: 'fixed',
      bottom: '7%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(88vw, 340px)',
      minHeight: '52px',
      padding: '14px 16px',
      boxSizing: 'border-box',
      border: '1px solid #D8B66A',
      borderRadius: '12px',
      background: 'linear-gradient(135deg,#153B32,#092722)',
      color: '#F8E5B3',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fontWeight: '700',
      letterSpacing: '0.05em',
      textAlign: 'center',
      cursor: 'pointer',
      touchAction: 'manipulation',
      display: 'none',
      zIndex: '2147483001',
    })

    document.body.appendChild(nextButton)

    const stopTimers = () => {
      if (riseTimer !== undefined) {
        window.clearTimeout(riseTimer)
        riseTimer = undefined
      }

      if (glowTimer !== undefined) {
        window.clearInterval(glowTimer)
        glowTimer = undefined
      }
    }

    const startGlow = () => {
      // A warm point light provides a golden aura around the reward.
      ecs.Light.set(world, eid, {
        type: 'point',
        intensity: 0.6,
        r: 255,
        g: 184,
        b: 70,
        castShadow: false,
      })

      if (glowTimer !== undefined) {
        window.clearInterval(glowTimer)
      }

      glowTimer = window.setInterval(() => {
        if (!treasureRevealed) return

        glowStep += 0.25

        const intensity = 0.75 + 0.3 * Math.sin(glowStep)

        ecs.Light.mutate(world, eid, (light) => {
          light.intensity = intensity
          return false
        })
      }, 180)
    }

    const showTreasureUI = () => {
      if (!targetVisible || !treasureRevealed) {
        hint.style.display = 'none'
        nextButton.style.display = 'none'
        return
      }

      if (riseFinished) {
        hint.style.display = 'none'
        nextButton.style.display = 'block'
      } else {
        hint.textContent = 'THE TREASURE EMERGES...'
        hint.style.display = 'block'
        nextButton.style.display = 'none'
      }
    }

    const revealTreasure = () => {
      if (
        !targetVisible ||
        !treasureUnlocked ||
        treasureRevealed
      ) {
        return
      }

      treasureRevealed = true
      riseFinished = false

      // Remove the old boss victory HUD from the top of the screen.
      const bossHud = document.getElementById('sonargaon-boss-hud')
      if (bossHud) {
        bossHud.style.display = 'none'
      }

      // Reveal the actual treasure model.
      ecs.Hidden.remove(world, eid)

      // Begin just below its original position.
      ecs.Position.set(world, eid, {
        x: baseX,
        y: baseY - 0.10,
        z: baseZ,
      })

      startGlow()
      showTreasureUI()
      world.events.dispatch(
  world.events.globalId,
  'sonargaonTreasureChestOpened',
  {chest: 'Ancient_Treasure_Chest'},
)

      // Rise smoothly into position.
      ecs.PositionAnimation.set(world, eid, {
        fromX: baseX,
        fromY: baseY - 0.10,
        fromZ: baseZ,
        toX: baseX,
        toY: baseY + 0.02,
        toZ: baseZ,
        autoFrom: false,
        duration: 900,
        loop: false,
        reverse: false,
        easeIn: false,
        easeOut: true,
        easingFunction: 'Cubic',
      })

      // After rising, float gently up and down.
      riseTimer = window.setTimeout(() => {
        riseTimer = undefined
        riseFinished = true

        ecs.PositionAnimation.set(world, eid, {
          fromX: baseX,
          fromY: baseY + 0.02,
          fromZ: baseZ,
          toX: baseX,
          toY: baseY + 0.07,
          toZ: baseZ,
          autoFrom: false,
          duration: 1400,
          loop: true,
          reverse: true,
          easeIn: true,
          easeOut: true,
          easingFunction: 'Sinusoidal',
        })

        showTreasureUI()
      }, 950)
    }

    // The next-level prompt becomes clickable after the treasure appears.
    nextButton.addEventListener('click', () => {
      if (
        !targetVisible ||
        !riseFinished ||
        nextLevelRequested
      ) {
        return
      }

      nextLevelRequested = true
      nextButton.disabled = true
      nextButton.textContent = 'LEVEL 2 UNLOCKED'

      world.events.dispatch(
        world.events.globalId,
        NEXT_LEVEL_EVENT,
        {completedLevel: 1, nextLevel: 2},
      )

      console.log('Level 1 complete — Level 2 unlocked!')
    })

    defineState('waiting')
      .initial()
      .onEnter(() => {
        targetVisible = false
        treasureUnlocked = false
        treasureRevealed = false
        riseFinished = false
        nextLevelRequested = false
        glowStep = 0

        stopTimers()

        hint.style.display = 'none'
        nextButton.style.display = 'none'
        nextButton.disabled = false
        nextButton.textContent = 'VICTORY — TAP TO NEXT LEVEL'

        if (ecs.PositionAnimation.has(world, eid)) {
          ecs.PositionAnimation.remove(world, eid)
        }

        // Keep the reward hidden before the relic box is opened.
        ecs.Hidden.set(world, eid, {})

        // The chest's original position is preserved.
        ecs.Position.set(world, eid, {
          x: baseX,
          y: baseY,
          z: baseZ,
        })

        // Add a disabled light so its component is ready for the reveal.
        ecs.Light.set(world, eid, {
          type: 'point',
          intensity: 0,
          r: 255,
          g: 184,
          b: 70,
          castShadow: false,
        })
      })

      // Recognize the poster.
      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_FOUND,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== targetName) return

          targetVisible = true

          if (treasureUnlocked && !treasureRevealed) {
            revealTreasure()
          } else if (treasureRevealed) {
            ecs.Hidden.remove(world, eid)
            showTreasureUI()
          }
        },
      )

      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_LOST,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== targetName) return

          targetVisible = false

          hint.style.display = 'none'
          nextButton.style.display = 'none'

          ecs.Hidden.set(world, eid, {})
        },
      )

      // Reveal the treasure only after the relic box has been tapped.
      .listen(
        world.events.globalId,
        RELIC_COLLECTED_EVENT,
        () => {
          treasureUnlocked = true

          if (targetVisible) {
            revealTreasure()
          }
        },
      )
  },
})
