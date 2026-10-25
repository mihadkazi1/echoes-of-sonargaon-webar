
import * as ecs from '@8thwall/ecs'

const GUARDIAN_DEFEATED_EVENT = 'sonargaonGuardianDefeated'

type GuardianPhase =
  | 'hidden'
  | 'alert'
  | 'threat'
  | 'idle'
  | 'ambient'
  | 'playerHit'
  | 'enemyAttack'
  | 'dead'
  | 'playerDefeated'
  | 'victory'

ecs.registerComponent({
  name: 'Cursed Guardian Controller',

  stateMachine: ({world, eid, defineState}) => {
    const targetName = 'sonargaon-poster'
    const maxBossHealth = 100
    const maxPlayerHealth = 100
    const playerDamage = 25
    const enemyDamage = 15

    let bossHealth = maxBossHealth
    let playerHealth = maxPlayerHealth
    let targetVisible = false
    let gateOpened = false
    let defeated = false
    let phase: GuardianPhase = 'hidden'
    let currentAmbientClip = ''
    let actionTimer: number | undefined

    // Prevent duplicate HUDs during editor reloads.
    document.getElementById('sonargaon-boss-hud')?.remove()
    document.getElementById('sonargaon-attack-hint')?.remove()
    document.getElementById('sonargaon-slash-effect')?.remove()

    // Create the combat HUD.
    const hud = document.createElement('div')
    hud.id = 'sonargaon-boss-hud'

    Object.assign(hud.style, {
      position: 'fixed',
      top: '4%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(88vw, 360px)',
      boxSizing: 'border-box',
      padding: '14px 16px',
      border: '1px solid #B9944F',
      borderRadius: '14px',
      background: 'rgba(7,39,36,0.96)',
      color: '#F8E5B3',
      fontFamily: 'Arial,sans-serif',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '2147483000',
    })

    const makeHealthBar = (labelText: string) => {
      const section = document.createElement('div')
      section.style.marginBottom = '12px'

      const label = document.createElement('div')
      label.textContent = labelText
      Object.assign(label.style, {
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.12em',
      })

      const value = document.createElement('div')
      value.style.cssText =
        'text-align:right;font-size:11px;margin:5px 0;'

      const track = document.createElement('div')
      track.style.cssText =
        'height:8px;background:#374541;overflow:hidden;border-radius:20px;'

      const fill = document.createElement('div')
      fill.style.cssText =
        'width:100%;height:100%;background:#C58B2A;transition:width 180ms ease;'

      track.appendChild(fill)
      section.append(label, value, track)
      hud.appendChild(section)

      return {value, fill}
    }

    const bossBar = makeHealthBar('CURSED GUARDIAN')
    const playerBar = makeHealthBar('YOUR HEALTH')

    const status = document.createElement('div')
    status.textContent = 'The guardian protects the treasure.'
    status.style.cssText =
      'font-size:11px;line-height:1.5;color:#D8D8CA;'

    hud.appendChild(status)
    document.body.appendChild(hud)

    // This is an instruction, not a button.
    const hint = document.createElement('div')
    hint.id = 'sonargaon-attack-hint'
    hint.textContent = 'TAP THE SWORD TO ATTACK'

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

    // Brief visual feedback when a sword strike lands.
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
      fontWeight: '700',
      textShadow: '0 0 18px rgba(255,183,55,0.9)',
      display: 'none',
      pointerEvents: 'none',
      zIndex: '2147483002',
    })

    document.body.appendChild(slash)

    const clearActionTimer = () => {
      if (actionTimer !== undefined) {
        window.clearTimeout(actionTimer)
        actionTimer = undefined
      }
    }

    const playClip = (clip: string, loop = false) => {
      ecs.GltfModel.mutate(world, eid, (model) => {
        model.animationClip = clip
        model.time = 0
        model.timeScale = 1
        model.paused = false
        model.loop = loop
        model.reverse = false
        model.repetitions = loop ? -1 : 0
        model.crossFadeDuration = 0.15
        return false
      })
    }

    const updateHealth = () => {
      bossBar.value.textContent =
        `${bossHealth} / ${maxBossHealth} HP`

      bossBar.fill.style.width =
        `${(bossHealth / maxBossHealth) * 100}%`

      bossBar.fill.style.background =
        bossHealth <= 25 ? '#DE5B48' :
        bossHealth <= 50 ? '#E79A53' :
        '#C58B2A'

      playerBar.value.textContent =
        `${playerHealth} / ${maxPlayerHealth} HP`

      playerBar.fill.style.width =
        `${(playerHealth / maxPlayerHealth) * 100}%`

      playerBar.fill.style.background =
        playerHealth <= 30 ? '#D94F45' : '#66B889'
    }

    const syncUI = () => {
      const introActive =
        phase === 'hidden' ||
        phase === 'alert' ||
        phase === 'threat'

      
const visible =
  targetVisible &&
  gateOpened &&
  !introActive &&
  phase !== 'dead' &&
  phase !== 'victory'


      hud.style.display = visible ? 'block' : 'none'

      const canShowHint =
        visible &&
        phase !== 'dead' &&
        phase !== 'victory' &&
        phase !== 'playerDefeated'

      hint.style.display = canShowHint ? 'block' : 'none'

      if (phase === 'enemyAttack') {
        hint.textContent = 'GUARDIAN ATTACKING — WAIT TO STRIKE'
      } else {
        hint.textContent = 'TAP THE SWORD TO ATTACK'
      }
    }

    const showSlash = () => {
      slash.style.display = 'block'

      const animation = slash.animate(
        [
          {
            opacity: 0,
            transform: 'translate(-50%,-50%) scale(0.6)',
          },
          {
            opacity: 1,
            transform: 'translate(-50%,-50%) scale(1.1)',
          },
          {
            opacity: 0,
            transform: 'translate(-50%,-65%) scale(1.3)',
          },
        ],
        {duration: 320, easing: 'ease-out'},
      )

      animation.onfinish = () => {
        slash.style.display = 'none'
      }
    }

    const scheduleNextAction = (delay = 2200) => {
      clearActionTimer()

      if (
        !targetVisible ||
        !gateOpened ||
        phase !== 'idle'
      ) {
        return
      }

      actionTimer = window.setTimeout(() => {
        actionTimer = undefined

        if (
          !targetVisible ||
          phase !== 'idle' ||
          defeated ||
          playerHealth <= 0
        ) {
          return
        }

        // Occasionally play a natural behavior before fighting again.
        const ambientClips = ['groom', 'perch', 'sway', 'buzz']

        if (Math.random() < 0.3) {
          currentAmbientClip =
            ambientClips[Math.floor(Math.random() * ambientClips.length)]

          phase = 'ambient'
          status.textContent = 'The guardian watches your movements.'
          syncUI()
          playClip(currentAmbientClip)
        } else {
          phase = 'enemyAttack'
          status.textContent = 'The guardian is attacking!'
          syncUI()
          playClip('attack')
          // Time the hit to the impact frame of the attack animation.
setTimeout(() => {
  if (phase !== 'enemyAttack' || !targetVisible) return

  playerHealth = Math.max(
    0,
    playerHealth - enemyDamage,
  )

  world.events.dispatch(
    world.events.globalId,
    'sonargaonPlayerDamaged',
    {},
  )

  syncUI()
}, 400)
        }
      }, delay)
    }

    const enterIdle = (nextDelay = 1800) => {
      phase = 'idle'
      currentAmbientClip = ''
      playClip('idle', true)

      status.textContent = 'Tap the guardian to strike.'
      syncUI()
      scheduleNextAction(nextDelay)
    }

    const startAttackFromPlayer = () => {
      if (
        !targetVisible ||
        !gateOpened ||
        defeated ||
        playerHealth <= 0
      ) {
        return
      }

      // Only accept attacks during idle or ambient behavior.
      if (phase === 'enemyAttack') {
        status.textContent =
          'Wait for the guardian to finish its strike!'
        return
      }

      if (phase !== 'idle' && phase !== 'ambient') {
        return
      }

      clearActionTimer()

      bossHealth = Math.max(0, bossHealth - playerDamage)
      updateHealth()
      showSlash()
      world.events.dispatch(
  world.events.globalId,
  'sonargaonSwordSwing',
  {},
)

      if (bossHealth <= 0) {
        defeated = true
        phase = 'dead'
        hint.style.display = 'none'
        status.textContent = 'The final strike has landed!'
if (bossHealth <= 0) {
  defeated = true
  phase = 'dead'
  hint.style.display = 'none'
  status.textContent = 'The final strike has landed!'

  // Play the enemy-death sound.
  world.events.dispatch(
    world.events.globalId,
    'sonargaonGuardianDeath',
    {},
  )

  playClip('dead')
}
        playClip('dead')
      } else {
        phase = 'playerHit'
        status.textContent = 'Hit landed! Prepare for the counterattack.'
        playClip('hit')
      }

      syncUI()
    }

    defineState('waiting')
      .initial()
      .onEnter(() => {
        bossHealth = maxBossHealth
        playerHealth = maxPlayerHealth
        targetVisible = false
        gateOpened = false
        defeated = false
        phase = 'hidden'
        currentAmbientClip = ''

        clearActionTimer()
        updateHealth()
        syncUI()

        status.textContent = 'The guardian protects the treasure.'

        // Hide the enemy until the gate opens.
        ecs.Hidden.set(world, eid, {})

        ecs.GltfModel.mutate(world, eid, (model) => {
          model.animationClip = 'idle'
          model.time = 0
          model.paused = true
          model.loop = true
          model.repetitions = -1
          model.timeScale = 1
          return false
        })
      })

      // Track the correct poster.
      .listen(
        world.events.globalId,
        ecs.events.REALITY_IMAGE_FOUND,
        (event) => {
          const data = event.data as {name?: string}
          if (data.name !== targetName) return

          targetVisible = true
          syncUI()

          if (phase === 'idle') {
            scheduleNextAction()
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
          clearActionTimer()
          syncUI()
          slash.style.display = 'none'
        },
      )

      // When the gate's open animation finishes, awaken the guardian.
      .listen(
        world.events.globalId,
        ecs.events.GLTF_ANIMATION_FINISHED,
        (event) => {
          const data = event.data as {name?: string}

          if (data.name !== 'open' || gateOpened) return

          gateOpened = true
          phase = 'alert'

          ecs.Hidden.remove(world, eid)

          status.textContent = 'The guardian has noticed you!'
          syncUI()

world.events.dispatch(
  world.events.globalId,
  'sonargaonGuardianAlert',
  {},
)

          playClip('alert')
        },
      )

      // These animation events belong to the guardian itself.
      .listen(
        eid,
        ecs.events.GLTF_ANIMATION_FINISHED,
        (event) => {
          const data = event.data as {name?: string}
          const clip = data.name

          // Intro choreography: alert -> threat -> idle.
          if (phase === 'alert' && clip === 'alert') {
            phase = 'threat'
            status.textContent = 'The guardian challenges you!'
            playClip('threat')
            syncUI()
            return
          }

          if (phase === 'threat' && clip === 'threat') {
            enterIdle(1800)
            return
          }

          // Optional ambient clips return to idle when finished.
          if (phase === 'ambient' && clip === currentAmbientClip) {
            enterIdle(900)
            return
          }

          // Player's strike reaction finishes.
          if (phase === 'playerHit' && clip === 'hit') {
            enterIdle(1500)
            return
          }

          // Enemy attack finishes and damages the player.
          if (phase === 'enemyAttack' && clip === 'attack') {
            if (targetVisible) {
              playerHealth = Math.max(
                0,
                playerHealth - enemyDamage,
              )
              
            }

            updateHealth()

            if (playerHealth <= 0) {
              phase = 'playerDefeated'
              status.textContent =
                'DEFEATED — SCAN AGAIN TO RETRY'

              clearActionTimer()
              playClip('idle', true)
              syncUI()
              return
            }

            enterIdle(1800)
            return
          }

          // Victory is triggered only after the death animation finishes.
          
if (phase === 'dead' && clip === 'dead') {
  phase = 'victory'

  // Hide the guardian after its death animation finishes.
  ecs.Hidden.set(world, eid, {})

  status.textContent = 'VICTORY — THE TREASURE AWAITS'
  hint.style.display = 'none'
  syncUI()

  // Unlock the relic.
  world.events.dispatch(
    world.events.globalId,
    'sonargaonGuardianDefeated',
    {guardian: 'Cursed_Cockroach_Guardian'},
  )
}

        },
      )

      // A touch on the actual 3D guardian triggers the player's strike.
      
.listen(
  world.events.globalId,
  'sonargaonPlayerSwordAttack',
  () => {
    startAttackFromPlayer()
  },
)

  },
})
