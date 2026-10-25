
import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Guardian Combat',

  stateMachine: ({world, eid, defineState}) => {
    const targetName = 'sonargaon-poster'
    const maxHealth = 100
    const damagePerStrike = 25
    const damageFromEnemy = 15

    let health = maxHealth
    let playerHealth = 100
    let targetVisible = false
    let gateOpened = false
    let defeated = false
    let playerDefeated = false
    let canAttack = true
    let enemyIsAttacking = false

    let attackCooldown: number | undefined
    let enemyAttackTimer: number | undefined

    // Clear old development HUDs.
    document.getElementById('sonargaon-boss-hud')?.remove()
    document.getElementById('sonargaon-attack-button')?.remove()
    document.getElementById('sonargaon-slash-effect')?.remove()
    document.getElementById('sonargaon-attack-hint')?.remove()

    // Main HUD.
    const hud = document.createElement('div')
    hud.id = 'sonargaon-boss-hud'

    Object.assign(hud.style, {
      position: 'fixed',
      top: '4%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(88vw, 360px)',
      padding: '14px 16px',
      boxSizing: 'border-box',
      border: '1px solid #B9944F',
      borderRadius: '14px',
      background: 'rgba(7,39,36,0.96)',
      color: '#F8E5B3',
      fontFamily: 'Arial,sans-serif',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '2147483000',
    })

    const createBar = (titleText: string, initial: string) => {
      const section = document.createElement('div')
      section.style.marginBottom = '12px'

      const label = document.createElement('div')
      label.textContent = titleText
      Object.assign(label.style, {
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.12em',
      })

      const value = document.createElement('div')
      value.textContent = initial
      Object.assign(value.style, {
        textAlign: 'right',
        fontSize: '11px',
        margin: '5px 0',
      })

      const track = document.createElement('div')
      Object.assign(track.style, {
        height: '8px',
        width: '100%',
        background: '#374541',
        overflow: 'hidden',
        borderRadius: '20px',
      })

      const fill = document.createElement('div')
      Object.assign(fill.style, {
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg,#C58B2A,#F5D784)',
        transition: 'width 180ms ease',
      })

      track.appendChild(fill)
      section.append(label, value, track)
      hud.appendChild(section)

      return {value, fill}
    }

    const bossBar = createBar('CURSED GUARDIAN', '100 / 100 HP')
    const playerBar = createBar('YOUR HEALTH', '100 / 100 HP')

    const status = document.createElement('div')
    status.textContent = 'Defeat the guardian to claim the treasure.'
    Object.assign(status.style, {
      fontSize: '11px',
      lineHeight: '1.5',
      color: '#D8D8CA',
    })

    hud.appendChild(status)
    document.body.appendChild(hud)

    // Non-interactive instruction at the bottom of the screen.
    const hint = document.createElement('div')
    hint.id = 'sonargaon-attack-hint'
    hint.textContent = 'TAP THE GUARDIAN TO ATTACK'

    Object.assign(hint.style, {
      position: 'fixed',
      bottom: '7%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(88vw, 340px)',
      padding: '14px 16px',
      boxSizing: 'border-box',
      border: '1px solid #CBA65E',
      borderRadius: '12px',
      background: 'rgba(7,39,36,0.94)',
      color: '#F8E5B3',
      fontFamily: 'Arial,sans-serif',
      fontWeight: '700',
      fontSize: '13px',
      letterSpacing: '0.07em',
      textAlign: 'center',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '2147483001',
    })

    document.body.appendChild(hint)

    // Brief visual feedback after a successful player strike.
    const slash = document.createElement('div')
    slash.id = 'sonargaon-slash-effect'
    slash.textContent = '✦ STRIKE!'

    Object.assign(slash.style, {
      position: 'fixed',
      top: '44%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      color: '#FFE8A3',
      fontSize: '26px',
      fontWeight: 'bold',
      textShadow: '0 0 18px rgba(255,183,55,0.9)',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '2147483002',
    })

    document.body.appendChild(slash)

    const updateHUD = () => {
      bossBar.value.textContent = `${health} / ${maxHealth} HP`
      bossBar.fill.style.width = `${health}%`

      playerBar.value.textContent = `${playerHealth} / 100 HP`
      playerBar.fill.style.width = `${playerHealth}%`
      playerBar.fill.style.background =
        playerHealth <= 30
          ? '#D94F45'
          : 'linear-gradient(90deg,#448E68,#8FD5A4)'

      if (health <= 50) {
        bossBar.fill.style.background = '#E79A53'
      }
      if (health <= 25) {
        bossBar.fill.style.background = '#DE5B48'
      }
    }

    const clearEnemyTimer = () => {
      if (enemyAttackTimer !== undefined) {
        window.clearTimeout(enemyAttackTimer)
        enemyAttackTimer = undefined
      }
    }

    const hideCombat = () => {
      hud.style.display = 'none'
      hint.style.display = 'none'
      slash.style.display = 'none'
      clearEnemyTimer()
    }

    const showCombat = () => {
      if (!targetVisible || !gateOpened) return

      hud.style.display = 'block'

      if (!defeated && !playerDefeated) {
        hint.style.display = 'block'
      }
    }

    const returnToIdle = () => {
      ecs.GltfModel.mutate(world, eid, (model) => {
        model.animationClip = 'idle'
        model.time = 0
        model.timeScale = 1
        model.paused = false
        model.loop = true
        model.reverse = false
        model.repetitions = -1
        model.crossFadeDuration = 0.15
        return false
      })
    }

    const playSlash = () => {
      slash.style.display = 'block'
      const animation = slash.animate(
        [
          {opacity: 0, transform: 'translate(-50%,-50%) scale(0.6)'},
          {opacity: 1, transform: 'translate(-50%,-50%) scale(1.1)'},
          {opacity: 0, transform: 'translate(-50%,-65%) scale(1.3)'},
        ],
        {duration: 320, easing: 'ease-out'},
      )
      animation.onfinish = () => {
        slash.style.display = 'none'
      }
    }

    // Schedule an enemy attack. The attack animation handles the
    // moment at which damage is applied.
    const scheduleEnemyAttack = (delay = 2200) => {
      clearEnemyTimer()

      if (
        !targetVisible ||
        !gateOpened ||
        defeated ||
        playerDefeated ||
        enemyIsAttacking
      ) {
        return
      }

      enemyAttackTimer = window.setTimeout(() => {
        enemyAttackTimer = undefined

        if (
          !targetVisible ||
          !gateOpened ||
          defeated ||
          playerDefeated ||
          enemyIsAttacking
        ) {
          return
        }

        enemyIsAttacking = true
        status.textContent = 'The guardian is attacking!'

        ecs.GltfModel.mutate(world, eid, (model) => {
          model.animationClip = 'attack'
          model.time = 0
          model.timeScale = 1
          model.paused = false
          model.loop = false
          model.reverse = false
          model.repetitions = 0
          model.crossFadeDuration = 0.1
          return false
        })
      }, delay)
    }

    // Player attacks by touching the actual guardian model.
    const handleGuardianTouch = () => {
      if (
        !targetVisible ||
        !gateOpened ||
        defeated ||
        playerDefeated ||
        !canAttack
      ) {
        return
      }

      if (enemyIsAttacking) {
        status.textContent = 'The guardian is striking! Prepare to counterattack.'
        return
      }

      canAttack = false
      health = Math.max(0, health - damagePerStrike)
      updateHUD()
      playSlash()

      if (health > 0) {
        status.textContent = 'Hit landed! Watch for the guardian’s counterattack.'

        attackCooldown = window.setTimeout(() => {
          canAttack = true
          attackCooldown = undefined
        }, 650)

        return
      }

      defeated = true
      enemyIsAttacking = false
      clearEnemyTimer()
      hint.style.display = 'none'
      status.textContent = 'The final strike has landed!'

      if (attackCooldown !== undefined) {
        window.clearTimeout(attackCooldown)
        attackCooldown = undefined
      }

      ecs.GltfModel.mutate(world, eid, (model) => {
        model.animationClip = 'dead'
        model.time = 0
        model.timeScale = 1
        model.paused = false
        model.loop = false
        model.reverse = false
        model.repetitions = 0
        model.crossFadeDuration = 0.1
        return false
      })
    }

    defineState('waiting')
      .initial()
      .onEnter(() => {
        health = maxHealth
        playerHealth = 100
        targetVisible = false
        gateOpened = false
        defeated = false
        playerDefeated = false
        canAttack = true
        enemyIsAttacking = false

        clearEnemyTimer()

        if (attackCooldown !== undefined) {
          window.clearTimeout(attackCooldown)
          attackCooldown = undefined
        }

        updateHUD()
        hideCombat()
        status.textContent = 'Tap the guardian to attack.'

        // Ensure the combat begins from the idle animation.
        returnToIdle()
      })

      // Track the target poster.
      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_FOUND,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== targetName) return

          targetVisible = true
          showCombat()

          if (gateOpened) {
            scheduleEnemyAttack()
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
          hideCombat()
        },
      )

      // Enable the battle after the gate finishes opening.
      .listen(
        world.events.globalId,
        ecs.events.GLTF_ANIMATION_FINISHED,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== 'open') return

          gateOpened = true
          showCombat()
          scheduleEnemyAttack(2200)
        },
      )

      // This entity listener catches taps on the guardian's mesh.
      .listen(eid, ecs.input.SCREEN_TOUCH_START, handleGuardianTouch)

      // When the enemy's attack animation ends, apply its damage.
      .listen(
        world.events.globalId,
        ecs.events.GLTF_ANIMATION_FINISHED,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== 'attack' || !enemyIsAttacking) return

          enemyIsAttacking = false

          if (!defeated && targetVisible && gateOpened && !playerDefeated) {
            playerHealth = Math.max(0, playerHealth - damageFromEnemy)
            updateHUD()

            if (playerHealth <= 0) {
              playerDefeated = true
              clearEnemyTimer()
              hint.style.display = 'none'
              status.textContent = 'YOU WERE DEFEATED — SCAN AGAIN TO RETRY'
            } else {
              status.textContent =
                'The guardian struck back! Touch it to counterattack.'
            }
          }

          if (!defeated) {
            returnToIdle()
          }

          if (!defeated && !playerDefeated && targetVisible && gateOpened) {
            scheduleEnemyAttack(2200)
          }
        },
      )

      // Victory after the death animation completes.
      .listen(
        world.events.globalId,
        ecs.events.GLTF_ANIMATION_FINISHED,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== 'dead' || !defeated) return

          status.textContent = 'VICTORY — THE TREASURE AWAITS'
          hint.style.display = 'none'
        },
      )
  },
})
