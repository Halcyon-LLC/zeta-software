<template>
  <div>
    <div ref="canvas" />
    <canvas id="heatmap" width="200" height="200" class="heatMap" />
  </div>
</template>

<script>
import * as THREE from 'three'
import TrackballControls from 'three-trackballcontrols'
import ProjectedMaterial from 'three-projected-material'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import simpleheat from 'simpleheat'

export default {
  name: 'CADViewer',

  props: {
    CADFile: String,
    PressureData: Array,
  },

  data() {
    return {
      scene: undefined,
      camera: undefined,
      controls: [],
      renderer: undefined,
      light: undefined,
      windowWidth: 500,
      windowHeight: 500,
      CADMesh: undefined,
      CADMaterial: undefined,
      maxNumHeatPoints: 100,
    }
  },

  watch: {
    PressureData() {
      this.scene.clear() //remove everything before adding to scene
      this.renderer.clear()
      this.init()
    },

    CADFile() {
      //must re-render if either data or cad file change
      //cad file does not exist on mounted right away.
      this.scene.clear() 
      this.renderer.clear()
      this.init()
    },
  },

  mounted() {
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
  },

  beforeUnmount() {
    this.controls.removeEventListener('change', this.render)
  },

  methods: {
    init() {
      this.light = new THREE.DirectionalLight('hsl(0, 100%, 100%)')
      const camera = new THREE.PerspectiveCamera(
        75,
        this.windowWidth / this.windowHeight, //aspect ratio
        0.01,
        500
      )
      this.camera = camera

      // Receiving the CADFile from backend and loading it into a Group object
      const loader = new OBJLoader()
      const result = loader.parse(this.CADFile)

      // Centering the CAD model in the scene
      let box = new THREE.Box3().setFromObject(result)
      let sphere = new THREE.Sphere()
      box.getBoundingSphere(sphere)
      const fov = this.camera.fov * (Math.PI / 180)
      let cameraZ = Math.abs((sphere.radius / 4) * Math.tan(fov * 2))
      cameraZ *= 7 // zoom out a little so that objects don't fill the screen
      this.camera.position.z = cameraZ

      // Projecting the heatmap onto the CAD model
      // TODO: Check if you can render a canvasTexture without any data points
      this.initHeatMap()
      var texture = new THREE.CanvasTexture(document.getElementById('heatmap'))

      const material = new ProjectedMaterial({
        camera, // the camera that acts as a projector
        texture, // the texture being projected
        textureScale: 0.8, // scale down the texture a bit
        textureOffset: new THREE.Vector2(0, 0), // you can translate the texture if you want
        cover: true, // enable background-size: cover behaviour, by default it's like background-size: contain
        color: '#FFF', // the color of the object if it's not projected on
        roughness: 0.3, // you can pass any other option that belongs to MeshPhysicalMaterial
      })
      const CADMesh = new THREE.Mesh(result.children[0].geometry, material)
      this.CADMesh = CADMesh
      this.CADMaterial = material

      this.createScene()
      this.startAnimation()
    },


    animate() {
      requestAnimationFrame(this.animate)
      this.renderer.render(this.scene, this.camera)
      this.controls.update()
    },

    render() {
      this.renderer.render(this.scene, this.camera)
    },

    initHeatMap() {
      let heat = simpleheat('heatmap')
      heat.max(this.maxNumHeatPoints)

      if (this.PressureData.length > 0) {
        this.PressureData.map((data) => {
          heat.add([Math.random()*200, data.y, data.pressure])
        })

        heat.draw()
      }
    },

    createScene() {
      this.scene.add(this.camera)
      this.scene.add(this.light)
      this.scene.add(this.CADMesh)
      this.renderer.setSize(this.windowWidth, this.windowHeight)
      this.light.position.set(0, 0, 5)
      this.CADMesh.position.set(0, 0, 0)
      this.scene.background = new THREE.Color('hsl(0, 100%, 100%)')
    },

    startAnimation() {
      this.$refs.canvas.appendChild(this.renderer.domElement)
      // Projecting the material onto the CAD mesh
      this.CADMaterial.project(this.CADMesh)
      this.controls = new TrackballControls(
        this.camera,
        this.renderer.domElement
      )
      this.controls.addEventListener('change', this.render)
      this.controls.rotateSpeed = 1.0
      this.controls.zoomSpeed = 5
      this.controls.panSpeed = 0.8
      this.controls.noZoom = true
      this.controls.noPan = false
      this.controls.staticMoving = true
      this.controls.dynamicDampingFactor = 0.3
      this.animate()
    },
  },
}
</script>

<style>
.heatMap {
  visibility: hidden;
  position: absolute;
}
</style>
