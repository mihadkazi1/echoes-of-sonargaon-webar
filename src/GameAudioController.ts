
import * as ecs from '@8thwall/ecs'

type SoundKey =
  | 'gate'
  | 'guardian'
  | 'sword'
  | 'treasure'
  | 'victory'
  | 'death'
  | 'playerDamage'

ecs.registerComponent({
  name: 'Game Audio Controller',

  schema: {
    // @asset
    gateOpenSound: ecs.string,

    // @asset
    guardianRoarSound: ecs.string,

    // @asset
    swordHitSound: ecs.string,

    // @asset
    treasureRevealSound: ecs.string,

    // @asset
    levelCompleteSound: ecs.string,

    // @asset
    guardianDeathSound: ecs.string,

    // @asset
    playerDamageSound: ecs.string,
  },

  schemaDefaults: {
    gateOpenSound: '',
    guardianRoarSound: '',
    swordHitSound: '',
    treasureRevealSound: '',
    levelCompleteSound: '',
    guardianDeathSound: '',
    playerDamageSound: '',
  },

  stateMachine: ({world, eid, schemaAttribute, defineState}) => {
    const audioContext = new AudioContext()
    const buffers = new Map<SoundKey, AudioBuffer>()
    const lastPlayed = new Map<SoundKey, number>()
    const activeSources = new Set<AudioBufferSourceNode>()

    const config = schemaAttribute.cursor(eid)

    const soundUrls: Record<SoundKey, string> = {
      gate: config.gateOpenSound,
      guardian: config.guardianRoarSound,
      sword: config.swordHitSound,
      treasure: config.treasureRevealSound,
      victory: config.levelCompleteSound,
      death: config.guardianDeathSound,
      playerDamage: config.playerDamageSound,
    }

    const volumes: Record<SoundKey, number> = {
      gate: 0.8,
      guardian: 0.65,
      sword: 0.5,
      treasure: 0.75,
      victory: 0.85,
      death: 1.0,
      playerDamage: 0.9,
    }

    // Download and decode sounds before they are needed.
    const soundsReady = Promise.all(
      (Object.keys(soundUrls) as SoundKey[]).map(async (key) => {
        const url = soundUrls[key]

        if (!url) {
          console.warn(
            `GameAudioController: no asset selected for ${key}`,
          )
          return
        }

        try {
          const response = await fetch(url)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const data = await response.arrayBuffer()
          const decoded = await audioContext.decodeAudioData(data)

          buffers.set(key, decoded)
        } catch (error) {
          console.warn(
            `GameAudioController: failed to preload ${key}:`,
            error,
          )
        }
      }),
    )

    const playSound = async (key: SoundKey) => {
      if (!soundUrls[key]) {
        console.warn(
          `GameAudioController: no asset selected for ${key}`,
        )
        return
      }

      const now = Date.now()
      const previous = lastPlayed.get(key) ?? 0

      if (now - previous < 250) return
      lastPlayed.set(key, now)

      try {
        await audioContext.resume()
        await soundsReady

        const buffer = buffers.get(key)

        if (!buffer) {
          console.warn(
            `GameAudioController: audio buffer unavailable for ${key}`,
          )
          return
        }

        const source = audioContext.createBufferSource()
        const gain = audioContext.createGain()

        source.buffer = buffer
        gain.gain.value = volumes[key]

        source.connect(gain)
        gain.connect(audioContext.destination)

        activeSources.add(source)

        source.onended = () => {
          activeSources.delete(source)
          source.disconnect()
          gain.disconnect()
        }

        source.start(0)
      } catch (error) {
        console.warn(
          `GameAudioController: playback failed for ${key}:`,
          error,
        )
      }
    }

    defineState('active')
      .initial()

      .listen(
        world.events.globalId,
        'sonargaonGateOpening',
        () => { void playSound('gate') },
      )

      .listen(
        world.events.globalId,
        'sonargaonGuardianAlert',
        () => { void playSound('guardian') },
      )

      .listen(
        world.events.globalId,
        'sonargaonSwordSwing',
        () => { void playSound('sword') },
      )

      .listen(
        world.events.globalId,
        'sonargaonRelicCollected',
        () => { void playSound('treasure') },
      )

      .listen(
        world.events.globalId,
        'sonargaonTreasureChestOpened',
        () => { void playSound('victory') },
      )

      .listen(
        world.events.globalId,
        'sonargaonGuardianDeath',
        () => { void playSound('death') },
      )

      // Enemy attack successfully damages the player.
      .listen(
        world.events.globalId,
        'sonargaonPlayerDamaged',
        () => { void playSound('playerDamage') },
      )
  },
})
