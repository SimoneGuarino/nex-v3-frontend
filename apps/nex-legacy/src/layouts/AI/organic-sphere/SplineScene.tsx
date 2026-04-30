import React, { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'

/** 1) Default settings & presets from the CodePen **/
const defaultSettings = {
    preset: 'Ice White' as keyof typeof colorPresets,
    animationSpeed: 1.3,
    waterStrength: 0.55,
    mouseIntensity: 1.2,
    clickIntensity: 3.0,
    damping: 0.913,
    tension: 0.02,
    rippleRadius: 8,
    splatForce: 50000,
    splatThickness: 0.1,
    vorticityInfluence: 0.2,
    swirlIntensity: 0.2,
    pressure: 0.3,
    velocityDissipation: 0.08,
    densityDissipation: 1.0,
    displacementScale: 0.01,
    audioReactivity: 1.0,
    bassResponse: 1.0,
    midResponse: 1.0,
    trebleResponse: 1.0,
    rippleStrength: 0.5,
};

const colorPresets = {
    "Electric Blue": { color1: [0, 0.5, 1], color2: [0, 0.8, 1], color3: [0.2, 0.3, 1], background: [0, 0.05, 0.1] },
    "Neon Pink": { color1: [1, 0, 0.5], color2: [1, 0.3, 0.7], color3: [0.9, 0.1, 0.6], background: [0.1, 0, 0.05] },
    "Cyber Green": { color1: [0, 1, 0.3], color2: [0.2, 0.9, 0.1], color3: [0, 0.8, 0.2], background: [0, 0.1, 0.02] },
    "Golden Hour": { color1: [1, 0.7, 0.2], color2: [1, 0.9, 0.3], color3: [0.9, 0.6, 0.1], background: [0.1, 0.05, 0] },
    "Deep Purple": { color1: [0.6, 0.2, 1], color2: [0.8, 0.4, 0.9], color3: [0.4, 0.1, 0.7], background: [0.05, 0, 0.1] },
    "Ice White": { color1: [1, 1, 1], color2: [0.9, 0.95, 1], color3: [0.8, 0.9, 1], background: [0.02, 0.02, 0.05] },
    "Pure Monochrome": { color1: [1, 1, 1], color2: [1, 1, 1], color3: [1, 1, 1], background: [0, 0, 0] },
};

/** 2) SceneContent: builds fluid sim, audio, shaders, ripple & animation **/
function SceneContent() {
    const { size, gl, camera } = useThree()

    const material = useRef<THREE.ShaderMaterial>(null!)
    const waterTex = useRef<THREE.DataTexture>(null!)
    const clock = useRef(new THREE.Clock())

    // Web Audio
    /*const analyser = useRef<AnalyserNode | null>(null)
    const dataArr = useRef<Uint8Array | null>(null)
    const audioEl = useRef(new Audio('https://assets.codepen.io/7558/xor-is-epic-1446.mp3'))

    const audioCtx = useRef<AudioContext>();
    const sourceNode = useRef<MediaElementAudioSourceNode>();
    const anl = useRef<AnalyserNode>();

    const targetRes = useRef(new THREE.Vector2(window.innerWidth, window.innerHeight))*/

    // Fluid sim buffers
    const RES = 256
    const buffers = useMemo(() => ({
        current: new Float32Array(RES * RES),
        previous: new Float32Array(RES * RES),
        velocity: new Float32Array(RES * RES * 2),
        vorticity: new Float32Array(RES * RES),
        pressure: new Float32Array(RES * RES),
    }), [])


    /** 2a) Shaders (copy-pasted integrally from CodePen) **/
    const vertexShader = `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position,1.0);
        }
    `
    const fragmentShader = `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_color1;
        uniform vec3 u_color2;
        uniform vec3 u_color3;
        uniform vec3 u_background;
        uniform float u_speed;
        uniform sampler2D u_waterTexture;
        uniform float u_waterStrength;
        uniform float u_ripple_time;
        uniform vec2 u_ripple_position;
        uniform float u_ripple_strength;
        uniform sampler2D u_textTexture;
        uniform bool u_showText;
        uniform bool u_isMonochrome;
        uniform float u_audioLow;
        uniform float u_audioMid;
        uniform float u_audioHigh;
        uniform float u_audioOverall;
        uniform float u_audioReactivity;
        varying vec2 vUv;
        void main(){
          vec2 r = u_resolution;
          vec2 FC = gl_FragCoord.xy;
          vec2 screenP = (FC*2.0-r)/r.y;
          vec2 wCoord = FC/r;
          float waterHeight = texture2D(u_waterTexture, wCoord).r;
          float waterInfluence = clamp(waterHeight*u_waterStrength,-0.5,0.5);
          float baseRadius = 0.9;
          float audioPulse = u_audioOverall*u_audioReactivity*0.1;
          float waterPulse = waterInfluence*0.3;
          float circleRadius = baseRadius + audioPulse + waterPulse;
          float inCircle = smoothstep(circleRadius+0.1, circleRadius-0.1, length(screenP));
          vec4 o = vec4(0.0);
          if(inCircle>0.0){
            vec2 p = screenP*1.1;
            float rippleTime = u_time - u_ripple_time;
            vec2 ripplePos = u_ripple_position*r;
            float rippleDist = distance(FC, ripplePos);
            float clickRipple=0.0;
            if(rippleTime>0.0 && rippleTime<3.0){
              float rippleRadius = rippleTime*150.0;
              float rippleWidth = 30.0;
              float rippleDecay = 1.0 - rippleTime/3.0;
              clickRipple = exp(-abs(rippleDist - rippleRadius)/rippleWidth)*rippleDecay*u_ripple_strength;
            }
            float totalWater = clamp((waterInfluence + clickRipple*0.1)*u_waterStrength,-0.8,0.8);
            float audioInf = (u_audioLow*0.3 + u_audioMid*0.4 + u_audioHigh*0.3)*u_audioReactivity;
            float angle = length(p)*4.0 + audioInf*2.0;
            mat2 R = mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
            p *= R;
            float l = length(p) - 0.7 + totalWater*0.5 + audioInf*0.2;
            float t = u_time*u_speed + totalWater*2.0 + audioInf*1.5;
            float enhancedY = p.y + totalWater*0.3 + audioInf*0.2;
            float pattern1 = 0.5+0.5*tanh(0.1/max(l/0.1,-l) - sin(l + enhancedY*max(1.0,-l/0.1)+t));
            float pattern2 = 0.5+0.5*tanh(0.1/max(l/0.1,-l) - sin(l + enhancedY*max(1.0,-l/0.1)+t+1.0));
            float pattern3 = 0.5+0.5*tanh(0.1/max(l/0.1,-l) - sin(l + enhancedY*max(1.0,-l/0.1)+t+2.0));
            float intensity = 1.0 + totalWater*0.5 + audioInf*0.3;
            if(u_isMonochrome){
              float m = (pattern1+pattern2+pattern3)/3.0*intensity;
              o = vec4(m,m,m,inCircle);
            } else {
              o.r = pattern1*u_color1.r*intensity;
              o.g = pattern2*u_color2.g*intensity;
              o.b = pattern3*u_color3.b*intensity;
              o.a = inCircle;
            }
          }
          vec3 bg = u_isMonochrome?vec3(0.0):u_background;
          vec3 col = mix(bg, o.rgb, o.a);
           gl_FragColor = vec4(o.rgb, o.a);
        }
    `

    /** 2b) Build uniforms + DataTexture **/
    const uniforms = useMemo(() => {
        // create and store DataTexture
        const tex = new THREE.DataTexture(buffers.current, RES, RES, THREE.RedFormat, THREE.FloatType)
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.needsUpdate = true
        waterTex.current = tex

        const preset = colorPresets[defaultSettings.preset]

        return {
            u_time: { value: 0 },
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_speed: { value: defaultSettings.animationSpeed },
            u_color1: { value: new THREE.Vector3(...preset.color1) },
            u_color2: { value: new THREE.Vector3(...preset.color2) },
            u_color3: { value: new THREE.Vector3(...preset.color3) },
            u_background: { value: new THREE.Vector3(...preset.background) },
            u_waterTexture: { value: tex },
            u_waterStrength: { value: defaultSettings.waterStrength },
            u_ripple_time: { value: -10 },
            u_ripple_position: { value: new THREE.Vector2(0.5, 0.5) },
            u_ripple_strength: { value: defaultSettings.rippleStrength },
            u_textTexture: { value: null },
            u_showText: { value: true },
            u_isMonochrome: { value: defaultSettings.preset === 'Pure Monochrome' },
            u_audioLow: { value: 0 },
            u_audioMid: { value: 0 },
            u_audioHigh: { value: 0 },
            u_audioOverall: { value: 0 },
            u_audioReactivity: { value: defaultSettings.audioReactivity },
        }
    }, [buffers])

    useEffect(() => {
        // whenever the canvas size changes...
        gl.setSize(size.width, size.height)
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        // update our resolution uniform (so the circle uses correct aspect)
        uniforms.u_resolution.value.set(size.width, size.height)

        // force camera (ortho) to update its projection matrix
        camera.updateProjectionMatrix()
    }, [size.width, size.height, gl, uniforms.u_resolution, camera])

    /** 2c) Initialize Web Audio **/
    /*useEffect(() => {
        // If we've already set up audio, do nothing.
        if (anl.current) return;

        const audio = audioEl.current;
        // create context and analyser just once
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;

        // wire up the source node
        const src = ctx.createMediaElementSource(audio);
        src.connect(analyserNode);
        analyserNode.connect(ctx.destination);

        // store refs
        audioCtx.current = ctx;
        sourceNode.current = src;
        anl.current = analyserNode;
        dataArr.current = new Uint8Array(analyserNode.frequencyBinCount);

        audio.loop = true;
        audio.crossOrigin = 'anonymous';
        audio.load();
        audio.play().catch(() => { }); // user gesture required… 

        // cleanup on unmount / HMR
        return () => {
            audio.pause();
            src.disconnect();
            analyserNode.disconnect();
            ctx.close();
        };
    }, []);*/

    /** 2d) Mouse & click → ripple **/
    /*useEffect(() => {
        const onMove = (e: MouseEvent) => {
            uniforms.u_ripple_position.value.set(
                e.clientX / window.innerWidth,
                1 - e.clientY / window.innerHeight
            )
            uniforms.u_ripple_time.value = clock.current.getElapsedTime()
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('click', onMove)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('click', onMove)
        }
    }, [uniforms])*/

    /** 2e) Main loop: update time, audio, fluid sim, texture **/
    useFrame(() => {
        // time
        uniforms.u_time.value = clock.current.getElapsedTime()

        // audio
        /*const anl = analyser.current, arr = dataArr.current
        if (anl && arr) {
            anl.getByteFrequencyData(arr)
            const len = arr.length
            const bEnd = Math.floor(len * 0.1)
            const mEnd = Math.floor(len * 0.5)
            let bass = 0, mid = 0, treble = 0
            for (let i = 0; i < bEnd; i++) bass += arr[i]
            for (let i = bEnd; i < mEnd; i++) mid += arr[i]
            for (let i = mEnd; i < len; i++) treble += arr[i]
            bass = bass / bEnd / 255 * defaultSettings.bassResponse
            mid = mid / (mEnd - bEnd) / 255 * defaultSettings.midResponse
            treble = treble / (len - mEnd) / 255 * defaultSettings.trebleResponse
            const overall = (bass + mid + treble) / 3
            const sm = 0.8
            uniforms.u_audioLow.value = uniforms.u_audioLow.value * sm + bass * (1 - sm)
            uniforms.u_audioMid.value = uniforms.u_audioMid.value * sm + mid * (1 - sm)
            uniforms.u_audioHigh.value = uniforms.u_audioHigh.value * sm + treble * (1 - sm)
            uniforms.u_audioOverall.value = uniforms.u_audioOverall.value * sm + overall * (1 - sm)
        }*/

        // fluid sim (copy-paste TS version of updateWaterSimulation)
        {
            const { current, previous, velocity, vorticity } = buffers
            const d = defaultSettings
            // velocity dissipation
            for (let i = 0; i < RES * RES * 2; i++) velocity[i] *= 1 - d.velocityDissipation
            // vorticity w/ edges
            for (let y = 1; y < RES - 1; y++) {
                for (let x = 1; x < RES - 1; x++) {
                    const i = y * RES + x
                    const left = velocity[(i - 1) * 2 + 1]
                    const right = velocity[(i + 1) * 2 + 1]
                    const bottom = velocity[(i - RES) * 2]
                    const topV = velocity[(i + RES) * 2]
                    vorticity[i] = (right - left - (topV - bottom)) * 0.5
                }
            }
            // apply vorticity forces
            const vi = Math.min(Math.max(d.swirlIntensity, 0), 0.5)
            if (vi > 0.001) {
                for (let y = 1; y < RES - 1; y++) {
                    for (let x = 1; x < RES - 1; x++) {
                        const i = y * RES + x, vi2 = i * 2
                        const l = Math.abs(vorticity[i - 1]), r = Math.abs(vorticity[i + 1]),
                            b = Math.abs(vorticity[i - RES]), t = Math.abs(vorticity[i + RES])
                        const gradX = (r - l) * 0.5, gradY = (t - b) * 0.5
                        const len = Math.hypot(gradX, gradY) + 1e-5
                        const sv = Math.max(-1, Math.min(1, vorticity[i]))
                        const fx = gradY / len * sv * vi * 0.1
                        const fy = -gradX / len * sv * vi * 0.1
                        velocity[vi2] += Math.max(-0.1, Math.min(0.1, fx))
                        velocity[vi2 + 1] += Math.max(-0.1, Math.min(0.1, fy))
                    }
                }
            }
            // wave equation
            for (let y = 1; y < RES - 1; y++) {
                for (let x = 1; x < RES - 1; x++) {
                    const i = y * RES + x, vi2 = i * 2
                    const t = previous[i - RES], b = previous[i + RES], l = previous[i - 1], r = previous[i + 1]
                    let c = (t + b + l + r) / 2 - current[i]
                    c = c * d.damping + previous[i] * (1 - d.damping)
                    c += (0 - previous[i]) * Math.min(d.tension, 0.05)
                    const vm = Math.hypot(velocity[vi2], velocity[vi2 + 1])
                    const safe = Math.min(vm * d.displacementScale, 0.1)
                    c += safe
                    c *= 1 - d.densityDissipation * 0.01
                    current[i] = Math.max(-2, Math.min(2, c))
                }
            }
            // zero edges
            for (let i = 0; i < RES; i++) {
                // top/bottom
                current[i] = current[(RES - 1) * RES + i] = 0
                velocity[i * 2] = velocity[i * 2 + 1] = 0
                velocity[((RES - 1) * RES + i) * 2] = velocity[((RES - 1) * RES + i) * 2 + 1] = 0
                // left/right
                current[i * RES] = current[i * RES + RES - 1] = 0
                velocity[i * RES * 2] = velocity[i * RES * 2 + 1] = 0
                velocity[(i * RES + RES - 1) * 2] = velocity[(i * RES + RES - 1) * 2 + 1] = 0
            }
            // swap buffers
            ;[buffers.current, buffers.previous] = [buffers.previous, buffers.current]
            waterTex.current!.image.data = buffers.current
        }

        waterTex.current!.needsUpdate = true
    })

    /** 2f) Fullscreen quad **/
    return (
        <mesh>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                transparent={true}
                ref={material}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                blending={THREE.NormalBlending}
                uniforms={uniforms}
            />
        </mesh>
    )
}

/** 4) Exported full-screen Canvas component **/
export const WaterShaderScene: React.FC = () => (
    <Canvas
        orthographic
        gl={{ antialias: true, alpha: true }}
        camera={{ zoom: 1, position: [0, 0, 1], near: 0.1, far: 10 }}
        style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            display: 'block',
        }}
    >
        {/* transparent background */}
        <SceneContent />
    </Canvas>
)
