<template>
  <div>
    <div
      class="button buttonSpacing"
      style="width: 225px"
      @click="resetCamera()"
    >
      Reset View
    </div>
    <div ref="canvas" class="CADViewer" />
    <canvas id="heatmapFront" width="450" height="250" class="heatMap" />
    <canvas id="heatmapBack" width="450" height="250" class="heatMap" />
  </div>
</template>

<script>
import * as THREE from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
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
      CADMeshFront: undefined,
      CADMeshBack: undefined,
      CADMaterialBack: undefined,
      CADMaterialFront: undefined,
      maxHeatIntensity: 100,
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
      const Z_ZOOM_SCALE = 10
      const camera = new THREE.PerspectiveCamera(
        75,
        this.windowWidth / this.windowHeight, //aspect ratio
        0.01,
        500
      )
      this.camera = camera

      // Adds a white directional light from the top and one that points out from the camera
      this.light = new THREE.DirectionalLight()
      camera.add(new THREE.PointLight(0xffffff, 1))

      // Receiving the CADFile from backend and loading it into a Group object
      const loader = new OBJLoader()
      const result = loader.parse(this.CADFile)

      // Centering the CAD model in the scene
      let box = new THREE.Box3().setFromObject(result)
      let sphere = new THREE.Sphere()
      box.getBoundingSphere(sphere)
      const fov = this.camera.fov * (Math.PI / 180)
      let cameraZ = Math.abs((sphere.radius / 4) * Math.tan(fov * 2))
      cameraZ *= Z_ZOOM_SCALE // zoom out a little so that objects don't fill the screen
      this.camera.position.z = cameraZ

      /*
        For each projection, we create a new mesh which has the canvas projected onto it's material
        Thus, the only thing we need to alter before creating a mesh, is move the camera to the specified
        location you want to project the texture from
      */
      this.CADMeshFront = this.generateMeshWithTexture(
        camera,
        result,
        'heatmapFront'
      )

      // Move camera close to the torso so it doesn't grow the projection
      this.camera.position = new THREE.Vector3(0, 2, -1.5)
      this.camera.lookAt(0, this.camera.position.y, 0)
      this.CADMeshBack = this.generateMeshWithTexture(
        this.camera,
        result,
        'heatmapBack'
      )

      // Moving camera back to ideal distance from torso
      this.camera.position = new THREE.Vector3(0, 0, -cameraZ)

      this.createScene()
      this.startAnimation()
    },

    generateMeshWithTexture(camera, CADModel, canvasID) {
      // Projecting the heatmap onto the CAD model
      this.initHeatMap(canvasID)
      var texture = new THREE.CanvasTexture(document.getElementById(canvasID))

      // You can pass any option that belongs to MeshPhysicalMaterial
      const material = new ProjectedMaterial({
        camera, // the camera that acts as a projector
        texture, // the texture being projected
        textureScale: 1.0, // scale down the texture a bit
        textureOffset: new THREE.Vector2(0, 0), // you can translate the texture if you want
        cover: true, // enable background-size: cover behaviour, by default it's like background-size: contain
        color: '#dfdfdf', // the color of the object if it's not projected on
        roughness: 1.0,
        reflectivity: 0.0,
        metalness: 0.0,
      })

      const CADMesh = new THREE.Mesh(CADModel.children[0].geometry, material)
      material.project(CADMesh)

      return CADMesh
    },

    animate() {
      requestAnimationFrame(this.animate)
      this.renderer.render(this.scene, this.camera)
      this.controls.update()
    },

    render() {
      this.renderer.render(this.scene, this.camera)
    },

    initHeatMap(canvasID) {
      let heat = simpleheat(canvasID)
      let radius = 30
      let blurRadius = 25
      heat.max(this.maxHeatIntensity)
      heat.radius(radius, blurRadius)

      console.log(this.PressureData)
      if (this.PressureData.length > 0) {
        if (canvasID == 'heatmapFront') {
          this.PressureData.map((data) => {
            heat.add([data.x, data.y, data.pressure])
          })
        } else {
          this.PressureData.map((data) => {
            heat.add([data.x, data.y, data.pressure / 5])
          })
        }
      }
      console.log(heat)
      heat.draw()
    },

    resetCamera() {
      // TODO: Try to do through moving camera or orbital controls
      this.scene.clear() //remove everything before adding to scene
      this.renderer.clear()
      this.init()
    },

    createScene() {
      this.scene.add(this.camera)
      this.scene.add(this.light)
      this.scene.add(this.CADMeshFront)
      this.scene.add(this.CADMeshBack)
      this.renderer.setSize(this.windowWidth, this.windowHeight)
      this.CADMeshFront.position.set(0, 0, 0)
      this.CADMeshBack.position.set(0, 0, -0.02)
      this.scene.background = new THREE.Color('hsl(0, 100%, 100%)')
    },

    startAnimation() {
      this.$refs.canvas.appendChild(this.renderer.domElement)
      // Projecting the material onto the CAD mesh
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
@import '../assets/styles/buttonStyles.css';
.buttonSpacing {
  margin: auto;
}
.heatMap {
  visibility: hidden;
  position: absolute;
}
</style>
