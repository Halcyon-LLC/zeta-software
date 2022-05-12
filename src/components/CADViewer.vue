<template>
    <div ref="canvas"/>
</template>

<script>
import * as THREE from 'three'
import TrackballControls from 'three-trackballcontrols'

export default {
    name: 'CADViewer',

    data: function() {
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(
            75,
            150 / 500, // don't hardcode this
            0.1,
            500
        )

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        const light = new THREE.DirectionalLight('hsl(0, 100%, 100%)')
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshStandardMaterial({
            side: THREE.FrontSide,
            color: 'hsl(0, 100%, 50%)',
            wireframe: false
        })
        const cube = new THREE.Mesh(geometry, material)
        const axes = new THREE.AxesHelper(5)

        return {
            scene: scene,
            camera: camera,
            controls: [],
            renderer: renderer,
            light: light,
            cube: cube,
            axes: axes,
            speed: 0.01
        }
    },

    created() {
        this.scene.add(this.camera)
        this.scene.add(this.light)
        this.scene.add(this.cube)
        this.scene.add(this.axes)
        this.renderer.setSize(150, 500)
        this.light.position.set(0, 0, 5)
        this.camera.position.z = 5
        this.scene.background = new THREE.Color('hsl(0, 100%, 100%)')
      
    },
    mounted() {
        this.$refs.canvas.appendChild(this.renderer.domElement)
        this.controls = new TrackballControls(this.camera, this.renderer.domElement)
        this.controls.addEventListener("change", this.render)
        this.controls.rotateSpeed = 1.0
        this.controls.zoomSpeed = 5
        this.controls.panSpeed = 0.8
        this.controls.noZoom = true
        this.controls.noPan = false
        this.controls.staticMoving = true
        this.controls.dynamicDampingFactor = 0.3
        this.animate()
    },

    computed: {
        rotate() {
            return this.speed === '' ? 0 : this.speed;
        }
    },

    methods: {
        animate() {
            requestAnimationFrame(this.animate)
            this.renderer.render(this.scene, this.camera)
            this.cube.rotation.y += this.speed
            this.controls.update()
        },

        render() {
            this.controls.target.copy(this.cube.position)
            this.renderer.render(this.scene, this.camera)
        }
    },
}
</script>

<style></style>
