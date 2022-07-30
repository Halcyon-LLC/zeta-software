<template>
  <div>
    <div class="button buttonSpacing" @click="resetCamera()">Reset View</div>
    <div ref="canvas" class="CADViewer" />
    <canvas id="heatmapFrontLeft" width="450" height="250" class="heatMap" />
    <canvas id="heatmapFrontRight" width="450" height="250" class="heatMap" />
    <canvas id="heatmapBackLeft" width="450" height="250" class="heatMap" />
    <canvas id="heatmapBackRight" width="450" height="250" class="heatMap" />
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
    pressureData: Object,
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
      canvasWidth: 450,
      canvasHeight: 250,
      CADMeshFrontLeft: undefined,
      CADMeshFrontRight: undefined,
      CADMeshBackLeft: undefined,
      CADMeshBackRight: undefined,
      CADMeshBackTop: undefined,
      maxHeatIntensity: 0,
      defaultHeatBlur: 16,
      defaultHeatRadius: 24,
      coordinateAxes: undefined,
      maxPressureValue: 545, //denoted as 545 kPa. Based on sensor capture.
    }
  },

  watch: {
    pressureData() {
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

      this.projectMats(camera, result)
      // Moving camera back to ideal distance from torso
      this.camera.position = new THREE.Vector3(0, 0, cameraZ)

      this.createScene()
      this.startAnimation()
    },

    projectMats(camera, result) {
      /*
        For each projection, we create a new mesh which has the canvas projected onto it's material
        Thus, the only thing we need to alter before creating a mesh, is move the camera to the specified
        location you want to project the texture from
      */
      // LEFT/RIGHT/BACK is from the perspective of the patient
      // Global coordinate system is from the perspective of the patient
      const FRONT_X_LEFT_CAM_POS = 1.2
      const FRONT_X_RIGHT_CAM_POS = -1.2
      const BACK_X_LEFT_CAM_POS = 1.3
      const BACK_X_RIGHT_CAM_POS = -1.3
      const FRONT_Z_CAM_POS = 3.1
      const BACK_LEFT_RIGHT_Z_CAM_POS = -5.7
      const BACK_TEXTURE_OFFSET = new THREE.Vector2(-0.05, 0.0)
      const BACK_TEXTURE_SCALE = 0.2

      //---- FRONT RIGHT MAT CALCULATIONS ----
      this.camera.position = new THREE.Vector3(
        FRONT_X_RIGHT_CAM_POS,
        0,
        FRONT_Z_CAM_POS
      )
      this.camera.lookAt(0, 0, 0)
      this.camera.rotation.z = Math.PI * 0.5
      this.CADMeshFrontRight = this.generateMeshWithHeatMapTexture(
        camera,
        result,
        'heatmapFrontRight',
        8,
        16,
        this.pressureData ? this.pressureData.frontRightPressureData : undefined
      )
      this.CADMeshFrontRight.material.textureOffset = new THREE.Vector2(
        0.2,
        -0.1
      )

      //---- FRONT LEFT MAT CALCULATIONS ----
      this.camera.position = new THREE.Vector3(
        FRONT_X_LEFT_CAM_POS,
        0,
        FRONT_Z_CAM_POS
      )
      this.camera.lookAt(0.0, 0, 0)
      this.camera.rotation.z = Math.PI * 0.5
      this.CADMeshFrontLeft = this.generateMeshWithHeatMapTexture(
        camera,
        result,
        'heatmapFrontLeft',
        8,
        16,
        this.pressureData ? this.pressureData.frontLeftPressureData : undefined
      )

      //---- BACK RIGHT MAT CALCULATIONS ----
      this.camera.position = new THREE.Vector3(
        BACK_X_RIGHT_CAM_POS,
        -0.1,
        BACK_LEFT_RIGHT_Z_CAM_POS
      )
      this.camera.lookAt(-0.9, 0, 0)
      this.camera.rotation.z = Math.PI * 0.5
      this.CADMeshBackRight = this.generateMeshWithHeatMapTexture(
        camera,
        result,
        'heatmapBackRight',
        8,
        16,
        this.pressureData ? this.pressureData.backRightPressureData : undefined
      )
      this.CADMeshBackRight.material.textureScale = BACK_TEXTURE_SCALE
      this.CADMeshBackRight.material.textureOffset = BACK_TEXTURE_OFFSET

      //---- BACK LEFT MAT CALCULATIONS ----
      this.camera.position = new THREE.Vector3(
        BACK_X_LEFT_CAM_POS,
        -0.1,
        BACK_LEFT_RIGHT_Z_CAM_POS
      )
      this.camera.lookAt(0.9, 0, 0)
      this.camera.rotation.z = Math.PI * 0.5
      this.CADMeshBackLeft = this.generateMeshWithHeatMapTexture(
        camera,
        result,
        'heatmapBackLeft',
        8,
        16,
        this.pressureData ? this.pressureData.backLeftPressureData : undefined
      )
      this.CADMeshBackLeft.material.textureScale = BACK_TEXTURE_SCALE
      this.CADMeshBackLeft.material.textureOffset = BACK_TEXTURE_OFFSET
    },

    generateMeshWithHeatMapTexture(
      camera,
      CADModel,
      canvasID,
      numRows,
      numCols,
      selectedMat,
      heatRadius = this.defaultHeatRadius,
      heatBlur = this.defaultHeatBlur
    ) {
      // Projecting the heatmap onto the CAD model
      this.initHeatMap(
        canvasID,
        numRows,
        numCols,
        selectedMat,
        heatRadius,
        heatBlur
      )

      let texture = new THREE.CanvasTexture(document.getElementById(canvasID))

      // You can pass any option that belongs to MeshPhysicalMaterial
      const material = new ProjectedMaterial({
        camera, // the camera that acts as a projector
        texture, // the texture being projected
        textureScale: 0.5, // scale down the texture a bit. the smaller it is the more preserved the shape is.
        textureOffset: new THREE.Vector2(0.2, 0.1), // you can translate the texture if you want
        cover: true, // enable background-size: cover behaviour, by default it's like background-size: contain
        color: '#dfdfdf', // the color of the object if it's not projected on
        roughness: 0.0,
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

    initHeatMap(canvasID, numRows, numCols, selectedMat, heatRadius, heatBlur) {
      this.maxHeatIntensity = this.maxPressureValue //max value is 545 kPca
      // Setting heatmap parameters
      let heat = simpleheat(canvasID)
      heat.max(this.maxHeatIntensity)
      heat.radius(heatRadius, heatBlur)

      if (selectedMat && selectedMat.length > 0) {
        // Read in the pressure data populating the canvasWidth (450 wide) col by col then row by row
        let pressureNum = 0
        for (let row = 1; row <= numRows; row++) {
          for (let col = 1; col <= numCols; col++) {
            heat.add([
              col * (this.canvasWidth / (numCols + 1)),
              row * (this.canvasHeight / (numRows + 1)),
              selectedMat[pressureNum],
            ])
            pressureNum++

            // Error check for less points in CSV than promised for the type of mat
            if (pressureNum >= selectedMat.length - 1) {
              break
            }
          }
        }
      }
      heat.draw(0.0)
    },

    resetCamera() {
      // TODO: Try to do through moving camera or orbital controls
      this.scene.clear() //remove everything before adding to scene
      this.renderer.clear()
      this.init()
    },

    createScene() {
      // From perspective of patient which is also the perspective of the global coordinate system
      const X_POS_FRONT_LEFT_OFFSET = 0.01
      const X_POS_FRONT_RIGHT_OFFSET = -0.01
      const X_POS_BACK_LEFT_OFFSET = 0.01
      const X_POS_BACK_RIGHT_OFFSET = -0.01
      const Z_POS_BACK_OFFSET = -0.01
      const Z_POS_FRONT_OFFSET = 0.1

      this.scene.add(this.coordinateAxes)
      this.scene.add(this.camera)
      this.scene.add(this.light)
      this.scene.add(this.CADMeshFrontLeft)
      this.scene.add(this.CADMeshFrontRight)
      this.scene.add(this.CADMeshBackLeft)
      this.scene.add(this.CADMeshBackRight)
      this.scene.add(this.CADMeshBackTop)

      this.renderer.setSize(this.windowWidth, this.windowHeight)

      this.CADMeshFrontLeft.position.set(X_POS_FRONT_LEFT_OFFSET, 0, 0.05)
      this.CADMeshFrontRight.position.set(X_POS_FRONT_RIGHT_OFFSET, 0, 0.05)
      this.CADMeshBackLeft.position.set(0.0, 0.0, 0)
      this.CADMeshBackRight.position.set(-0.0, 0, 0)
      this.CADMeshBackRight.rotation.y = -0.0174533
      this.CADMeshBackLeft.rotation.y = 0.0174533
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
      this.controls.rotateSpeed = 3.0
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
  width: 225px;
}
.heatMap {
  visibility: hidden;
  position: absolute;
}
</style>
