<template>
  <div ref="canvas" />
</template>

<script>
import * as THREE from 'three'
import TrackballControls from 'three-trackballcontrols'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

export default {
  name: 'CADViewer',

  props: {
    CADFile: String,
  },

  data: function () {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      // this.windowWidth / this.windowHeight, // don't hardcode this 150/ 500
      500 / 500, // don't hardcode this 150/ 500
      0.01,
      500
    )

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    const light = new THREE.DirectionalLight('hsl(0, 100%, 100%)')
    // const cube = new THREE.Group();
    // if(this.CADFile) {
    //     const loader = new OBJLoader()
    //     const result = loader.parse( this.CADFile );

    //     console.log(result)
    // }

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({
      side: THREE.FrontSide,
      color: 'hsl(0, 100%, 50%)',
      wireframe: false,
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
      speed: 0.01,
      windowWidth: 500,
      windowHeight: 500,
    }
  },

  watch: {
    CADFile() {
      console.log(this.CADFile)
      const loader = new OBJLoader()
      const result = loader.parse(this.CADFile)

      let box = new THREE.Box3().setFromObject(result)
      let sphere = new THREE.Sphere()
      box.getBoundingSphere(sphere)
      let center = sphere.center
      console.log(center)
      console.log(sphere.radius)

      const fov = this.camera.fov * (Math.PI / 180)
      let cameraZ = Math.abs((sphere.radius / 4) * Math.tan(fov * 2))
      cameraZ *= 7 // zoom out a little so that objects don't fill the screen
      this.camera.position.z = cameraZ

      this.camera.updateProjectionMatrix()

      if (this.controls) {
        // set camera to rotate around center of loaded object
        this.controls.target = center
      } else {
        this.camera.lookAt(center)
      }

      // this.cube = result //add the 3Dobject to the scene
      console.log('Two')
      console.log(this.scene)
      this.scene.add(result)
      result.position.set(0, 0, 0)
      result.rotation.y += this.speed
      this.createScene()
      this.startAnimation()
    },
  },

  // created() {
  //     this.scene.add(this.camera)
  //     this.scene.add(this.light)
  //     this.scene.add(this.axes)
  //     this.renderer.setSize(150, 500)
  //     this.light.position.set(0, 0, 5)
  //     this.camera.position.z = 5
  //     this.scene.background = new THREE.Color('hsl(0, 100%, 100%)')

  // },

  // mounted() {
  //     this.$refs.canvas.appendChild(this.renderer.domElement)
  //     this.controls = new TrackballControls(this.camera, this.renderer.domElement)
  //     this.controls.addEventListener("change", this.render)
  //     this.controls.rotateSpeed = 1.0
  //     this.controls.zoomSpeed = 5
  //     this.controls.panSpeed = 0.8
  //     this.controls.noZoom = true
  //     this.controls.noPan = false
  //     this.controls.staticMoving = true
  //     this.controls.dynamicDampingFactor = 0.3
  //     this.animate()
  // },

  beforeUnmount() {
    this.controls.removeEventListener('change', this.render)
  },

  computed: {
    rotate() {
      return this.speed === '' ? 0 : this.speed
    },
  },

  methods: {
    animate() {
      requestAnimationFrame(this.animate)
      this.renderer.render(this.scene, this.camera)
      this.controls.update()
    },

    render() {
      this.renderer.render(this.scene, this.camera)
    },

    createScene() {
      this.scene.add(this.camera)
      this.scene.add(this.light)
      this.scene.add(this.axes)
      this.renderer.setSize(500, 500)
      this.light.position.set(0, 0, 5)
      // this.camera.position.z = 5
      this.scene.background = new THREE.Color('hsl(0, 100%, 100%)')
    },

    startAnimation() {
      this.$refs.canvas.appendChild(this.renderer.domElement)
      this.controls = new TrackballControls(
        this.camera,
        this.renderer.domElement
      )
      this.controls.addEventListener('change', this.render)
      this.controls.rotateSpeed = 1.0
      this.controls.zoomSpeed = 5
      this.controls.panSpeed = 0.8
      this.controls.noZoom = false
      this.controls.noPan = false
      this.controls.staticMoving = true
      this.controls.dynamicDampingFactor = 0.3
      this.animate()
    },
  },
}
</script>

<style></style>
