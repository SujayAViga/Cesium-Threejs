import * as THREE from 'three';
import { TilesRenderer, CesiumIonTilesRenderer } from '3d-tiles-renderer';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/dracoloader';
import {
	Scene,
	WebGLRenderer,
	PerspectiveCamera,
	Vector3,
	Quaternion,
	Group,
	Sphere,
} from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/gltfloader';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { Sky } from 'three/addons/objects/Sky.js';
import Stats from 'three/addons/libs/stats.module.js';

let camera, controls, scene, renderer, tiles,cube,cubeGeo,cubeMat,light;

const params = {

	'ionAssetId': '2310472',
	'ionAccessToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyZjk1OTU2My1mNDBhLTQzYzEtOTcxMS01MzNiOWIxMDZiYTMiLCJpZCI6MTY2MDkxLCJpYXQiOjE2OTQ1NDMyOTN9.rHxFqNMZ26EFHwHYUJ-xW0fDZtjamHXiM-4HR6YIHXY',
	'reload': reinstantiateTiles,

};


//-------------tiles setup-----------------//
function rotationBetweenDirections( dir1, dir2 ) {

	const rotation = new Quaternion();
	const a = new Vector3().crossVectors( dir1, dir2 );
	rotation.x = a.x;
	rotation.y = a.y;
	rotation.z = a.z;
	rotation.w = 1 + dir1.clone().dot( dir2 );
	rotation.normalize();

	return rotation;

}

function setupTiles() {

	tiles.fetchOptions.mode = 'cors';

	// Note the DRACO compression files need to be supplied via an explicit source.
	// We use unpkg here but in practice should be provided by the application.
	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath( 'https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/gltf/' );

	const loader = new GLTFLoader( tiles.manager );
	loader.setDRACOLoader( dracoLoader );

	tiles.manager.addHandler( /\.gltf$/, loader );
	scene.add( tiles.group );

}

function reinstantiateTiles() {

	if ( tiles ) {

		scene.remove( tiles.group );
		tiles.dispose();
		tiles = null;

	}

	tiles = new CesiumIonTilesRenderer( params.ionAssetId, params.ionAccessToken );
	tiles.onLoadTileSet = () => {

		// because ion examples typically are positioned on the planet surface we can orient
		// it such that up is Y+ and center the model
		const sphere = new Sphere();
		tiles.getBoundingSphere( sphere );

		const position = sphere.center.clone();
		const distanceToEllipsoidCenter = position.length();

		const surfaceDirection = position.normalize();
		const up = new Vector3( 0, 1, 0 );
		const rotationToNorthPole = rotationBetweenDirections( surfaceDirection, up );

		tiles.group.quaternion.x = rotationToNorthPole.x;
		tiles.group.quaternion.y = rotationToNorthPole.y;
		tiles.group.quaternion.z = rotationToNorthPole.z;
		tiles.group.quaternion.w = rotationToNorthPole.w;

		tiles.group.position.y = - distanceToEllipsoidCenter;

	};

	setupTiles();

}
//-------------tiles setup-----------------//

//-------------------------------scene setup--------------------//



// FPS controls
	let moveForward = false;
	let moveBackward = false;
	let moveLeft = false;
	let moveRight = false;
	let canJump = false;

	let prevTime = performance.now();
	const velocity = new THREE.Vector3();
	const direction = new THREE.Vector3();

function updateFPSControls(){
	const time = performance.now();
	const delta = ( time - prevTime ) / 1000;

	velocity.x -= velocity.x * 10.0 * delta;
	velocity.z -= velocity.z * 10.0 * delta;

	velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

	direction.z = Number( moveForward ) - Number( moveBackward );
	direction.x = Number( moveRight ) - Number( moveLeft );
	direction.normalize(); // this ensures consistent movements in all directions

	if ( moveForward || moveBackward ) velocity.z -= direction.z * 1000.0 * delta;//intial value 300
	if ( moveLeft || moveRight ) velocity.x -= direction.x * 1000.0 * delta;//initial value 300

	FPScontrols.moveRight( - velocity.x * delta );
	FPScontrols.moveForward( - velocity.z * delta );
	
	prevTime = time;
}



	scene = new Scene();
	renderer = new WebGLRenderer( { antialias: true } );
	let sky, sun;
	// Add Sky
	sky = new Sky();
	sky.scale.setScalar( 450000 );
	scene.add( sky );

	sun = new THREE.Vector3();
	const effectController = {
		turbidity: 10,
		rayleigh: 3,
		mieCoefficient: 0.005,
		mieDirectionalG: 0.7,
		elevation: 2,
		azimuth: 180,
		exposure: renderer.toneMappingExposure
	};
	const uniforms = sky.material.uniforms;
					uniforms[ 'turbidity' ].value = effectController.turbidity;
					uniforms[ 'rayleigh' ].value = effectController.rayleigh;
					uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
					uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

					const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
					const theta = THREE.MathUtils.degToRad( effectController.azimuth );

					sun.setFromSphericalCoords( 1, phi, theta );

					uniforms[ 'sunPosition' ].value.copy( sun );

					renderer.toneMappingExposure = effectController.exposure;

	// primary camera view
	
	renderer.setClearColor( 0x151c1f );

	document.body.appendChild( renderer.domElement );
	renderer.domElement.tabIndex = 1;

	camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 4000 );
	camera.position.set( 0, -17, 0 );
	// controls = new OrbitControls( camera, renderer.domElement );
	const FPScontrols = new PointerLockControls(camera,renderer.domElement);
	document.addEventListener('click',function(){FPScontrols.lock();})
	

	const onKeyDown = function ( event ) {

		switch ( event.code ) {

			case 'ArrowUp':
			case 'KeyW':
				moveForward = true;
				break;

			case 'ArrowLeft':
			case 'KeyA':
				moveLeft = true;
				break;

			case 'ArrowDown':
			case 'KeyS':
				moveBackward = true;
				break;

			case 'ArrowRight':
			case 'KeyD':
				moveRight = true;
				break;

			case 'Space':
				if ( canJump === true ) velocity.y += 350;
				canJump = false;
				break;

		}

	};

	const onKeyUp = function ( event ) {

		switch ( event.code ) {

			case 'ArrowUp':
			case 'KeyW':
				moveForward = false;
				break;

			case 'ArrowLeft':
			case 'KeyA':
				moveLeft = false;
				break;

			case 'ArrowDown':
			case 'KeyS':
				moveBackward = false;
				break;

			case 'ArrowRight':
			case 'KeyD':
				moveRight = false;
				break;

		}

	};
	document.addEventListener( 'keydown', onKeyDown );
	document.addEventListener( 'keyup', onKeyUp );

	

	cubeGeo = new THREE.BoxGeometry( 1, 1, 1 );
	cubeMat = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	cube = new THREE.Mesh( cubeGeo, cubeMat );
	// scene.add( cube );
	
	light = new THREE.AmbientLight( 0x404040,50 ); // soft white light
	scene.add( light );

	reinstantiateTiles();

	onWindowResize();
	window.addEventListener( 'resize', onWindowResize, false );
// ---------------------------------------------//

	// GUI
	const gui = new GUI();
	gui.width = 300;

	const ionOptions = gui.addFolder( 'Ion' );
	ionOptions.add( params, 'ionAssetId' );
	ionOptions.add( params, 'ionAccessToken' );
	ionOptions.add( params, 'reload' );
	ionOptions.open();

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

}

function animate() {

	requestAnimationFrame( animate );
	updateFPSControls();
	if ( ! tiles ) return;

	tiles.setCamera( camera );
	tiles.setResolutionFromRenderer( camera, renderer );

	// update tiles
	camera.updateMatrixWorld();
	tiles.update();

	renderer.render( scene, camera );

}


animate();